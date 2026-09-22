// 写真 1 枚の入稿。EXIF 読み取り → 長辺 2500px へ縮小 → Release photos へ登録 → YAML 雛形の生成。
// 変換規則は src/lib/photo-meta.ts に置き、ここは I/O だけを持つ（設計 D5）。
// node が直接実行するので、相対 import には .ts を付ける
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import exifr from 'exifr';
import sharp from 'sharp';
import { PHOTO_BASE_URL } from '../src/content/schemas.ts';
import {
  exifToPhotoMeta,
  ghFailureMessage,
  hasFeaturedFlag,
  isReleaseNotFound,
  nextOrder,
  parseOrder,
  renderPhotoYaml,
  toSlug,
  translateMissingFields,
} from '../src/lib/photo-meta.ts';

/** リポジトリのルート。cwd がどこでも同じ場所を読み書きする（scripts/ の 1 つ上） */
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PHOTOS_DIR = join(ROOT, 'src/content/photos');
const ASTRO_ASSETS_CACHE = join(ROOT, 'node_modules/.astro/assets');
const RELEASE_TAG = 'photos';
const MAX_EDGE = 2500;
const USAGE = '使い方: pnpm photo:add <画像ファイル> [--slug <名前>]';

function die(message: string): never {
  console.error(`photo:add: ${message}`);
  process.exit(1);
}

// gh の失敗（未ログイン、ネットワーク断、gh が無いなど）はスタックトレースではなく die の 1 行にする
function gh(args: string[]): string {
  try {
    return execFileSync('gh', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    die(ghFailureMessage(error));
  }
}

/** 例外を die の 1 行に載せる文言にする */
const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));

// gh を一度も呼ばずに判定できるよう、引数と slug の検査はアカウント確認より前に行う（spec の手順 1→2）
function parseCliArgs(argv: string[]): { file: string; slug: string } {
  let parsed: { values: { slug?: string }; positionals: string[] };
  try {
    parsed = parseArgs({
      args: argv,
      options: { slug: { type: 'string' } },
      allowPositionals: true,
    });
  } catch (error) {
    die(`${reason(error)}\n${USAGE}`);
  }
  const file = parsed.positionals[0];
  if (file === undefined) die(USAGE);
  try {
    return { file, slug: toSlug(basename(file), parsed.values.slug) };
  } catch (error) {
    die(reason(error));
  }
}

// (1) 引数を解釈する。使えない引数・slug なら、GitHub に問い合わせる前に理由を示して中断する
const { file, slug } = parseCliArgs(process.argv.slice(2));

// (2) gh のアカウント確認。違うアカウントなら何も変更せずに止まる（設計書 §5.3）
const login = gh(['api', 'user', '--jq', '.login']);
if (login !== 'joe-yama') {
  die(`gh のアカウントが joe-yama ではない（${login}）。gh auth switch で切り替える`);
}

if (!existsSync(file)) die(`ファイルが無い: ${file}`);

// (3) EXIF を読む。縮小前の元画像から読む。
// exifr@7.1.3 のファイルパス経路は fstat を旧 API 形で呼んでおり Node 26 で
// ERR_INVALID_ARG_TYPE になるため、Buffer に読んでから渡す。
// EXIF を 1 つも持たない画像では exifr.parse が undefined を返すが、その場合も
// 「項目名を挙げて中断」の経路に合流させるため空オブジェクトとして扱う
const raw = (await exifr.parse(await readFile(file), { translateValues: false })) ?? {};

// (4) 足りない項目があれば名前を挙げて中断する
const result = exifToPhotoMeta(raw);
if (!result.ok)
  die(`撮影情報を読み取れない項目がある: ${translateMissingFields(result.missing).join('、')}`);

// (5) 長辺 2500px 以下・sRGB・品質 90 に変換する。withoutEnlargement で拡大はしない
const work = mkdtempSync(join(tmpdir(), 'photo-add-'));
const jpeg = join(work, `${slug}.jpg`);
const info = await sharp(file)
  .rotate()
  .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
  .toColorspace('srgb')
  .jpeg({ quality: 90 })
  .toFile(jpeg);
console.log(`縮小: ${info.width} x ${info.height}`);

// (6) Release が無ければ作り、asset を上げる（同名は --clobber で差し替え）。
// 「Release が無い」以外の失敗（未ログインなど）は release create に進まず die で止める
try {
  execFileSync('gh', ['release', 'view', RELEASE_TAG], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (error) {
  if (!isReleaseNotFound(error)) die(ghFailureMessage(error));
  console.log(`Release ${RELEASE_TAG} を作る`);
  gh([
    'release',
    'create',
    RELEASE_TAG,
    '--latest=false',
    '--title',
    RELEASE_TAG,
    '--notes',
    '写真の元画像',
  ]);
}
gh(['release', 'upload', RELEASE_TAG, jpeg, '--clobber']);
console.log(`登録: ${RELEASE_TAG}/${slug}.jpg`);

// (7) 写真データファイルが既にあれば書き換えない（差し替え）。無ければ新規に生成する
mkdirSync(PHOTOS_DIR, { recursive: true });
const yamlPath = join(PHOTOS_DIR, `${slug}.yaml`);
if (existsSync(yamlPath)) {
  // 差し替え経路でだけキャッシュを消す。古い画像の版がビルド出力に残るのを防ぐ（新規入稿では呼ばない）
  rmSync(ASTRO_ASSETS_CACHE, { recursive: true, force: true });
  console.log(`差し替え: ${yamlPath} は変更していない（画像の登録のみ実施）`);
} else {
  const existing = readdirSync(PHOTOS_DIR).filter((f) => f.endsWith('.yaml'));
  const yamlTexts = existing.map((f) => readFileSync(join(PHOTOS_DIR, f), 'utf8'));
  const orders = yamlTexts.map(parseOrder);
  const hasFeatured = yamlTexts.some(hasFeaturedFlag);
  writeFileSync(
    yamlPath,
    renderPhotoYaml(result.meta, `${PHOTO_BASE_URL}${slug}.jpg`, nextOrder(orders), !hasFeatured),
  );
  console.log(`生成: ${yamlPath}`);
  console.log(
    '次: title / location / alt を日英で記入してから pnpm build する（未記入だとビルドが止まる）',
  );
}
