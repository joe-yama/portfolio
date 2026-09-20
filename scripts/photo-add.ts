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
  writeFileSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import exifr from 'exifr';
import sharp from 'sharp';
import { PHOTO_BASE_URL } from '../src/content/schemas.ts';
import { exifToPhotoMeta, nextOrder, renderPhotoYaml, toSlug } from '../src/lib/photo-meta.ts';

const PHOTOS_DIR = 'src/content/photos';
const RELEASE_TAG = 'photos';
const MAX_EDGE = 2500;

function die(message: string): never {
  console.error(`photo:add: ${message}`);
  process.exit(1);
}

function gh(args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf8' }).trim();
}

function parseArgs(argv: string[]): { file: string; slug?: string } {
  const rest = [...argv];
  let slug: string | undefined;
  const i = rest.indexOf('--slug');
  if (i >= 0) {
    slug = rest[i + 1];
    if (slug === undefined) die('--slug に値がない');
    rest.splice(i, 2);
  }
  const file = rest[0];
  if (file === undefined) die('使い方: pnpm photo:add <画像ファイル> [--slug <名前>]');
  return { file, slug };
}

// (1) gh のアカウント確認。違うアカウントなら何も変更せずに止まる（設計書 §5.3）
const login = gh(['api', 'user', '--jq', '.login']);
if (login !== 'joe-yama') {
  die(`gh のアカウントが joe-yama ではない（${login}）。gh auth switch で切り替える`);
}

const { file, slug: slugArg } = parseArgs(process.argv.slice(2));
if (!existsSync(file)) die(`ファイルが無い: ${file}`);
const slug = toSlug(slugArg ?? basename(file));

// (2) EXIF を読む。縮小前の元画像から読む。
// exifr@7.1.3 のファイルパス経路は fstat を旧 API 形で呼んでおり Node 26 で
// ERR_INVALID_ARG_TYPE になるため、Buffer に読んでから渡す
const raw = await exifr.parse(await readFile(file), { translateValues: false });
if (!raw) die(`EXIF を読めない: ${file}`);

// (3) 足りない項目があれば名前を挙げて中断する
const result = exifToPhotoMeta(raw, slug);
if (!result.ok) die(`EXIF に必要な項目が無い: ${result.missing.join(', ')}`);

// (4) 長辺 2500px 以下・sRGB・品質 90 に変換する。withoutEnlargement で拡大はしない
const work = mkdtempSync(join(tmpdir(), 'photo-add-'));
const jpeg = join(work, `${slug}.jpg`);
const info = await sharp(file)
  .rotate()
  .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
  .toColorspace('srgb')
  .jpeg({ quality: 90 })
  .toFile(jpeg);
console.log(`縮小: ${info.width} x ${info.height}`);

// (5) Release が無ければ作り、asset を上げる（同名は --clobber で差し替え）
try {
  gh(['release', 'view', RELEASE_TAG]);
} catch {
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

// (6) YAML を書く。asset が上がった後に書くので、途中で失敗しても再実行で回復できる
mkdirSync(PHOTOS_DIR, { recursive: true });
const existing = readdirSync(PHOTOS_DIR).filter((f) => f.endsWith('.yaml'));
const orders = existing.map((f) => {
  const m = readFileSync(join(PHOTOS_DIR, f), 'utf8').match(/^order:\s*(-?\d+)/m);
  return m ? Number(m[1]) : 0;
});
const hasFeatured = existing.some((f) =>
  /^featured:\s*true\s*$/m.test(readFileSync(join(PHOTOS_DIR, f), 'utf8')),
);
const yamlPath = join(PHOTOS_DIR, `${slug}.yaml`);
writeFileSync(
  yamlPath,
  renderPhotoYaml(result.meta, `${PHOTO_BASE_URL}${slug}.jpg`, nextOrder(orders), !hasFeatured),
);

console.log(`生成: ${yamlPath}`);
console.log(
  '次: title / location / alt を日英で記入してから pnpm build する（未記入だとビルドが止まる）',
);
