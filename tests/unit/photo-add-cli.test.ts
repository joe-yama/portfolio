import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { afterAll, describe, expect, it } from 'vitest';

const SCRIPT = fileURLToPath(new URL('../../scripts/photo-add.ts', import.meta.url));
const USAGE = '使い方: pnpm photo:add <画像ファイル> [--slug <名前>]';

const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

/**
 * 一時ディレクトリを cwd にして pnpm photo:add 相当を実行する。gh は偽物で、
 * 呼ばれたら gh.log に引数を書き（= GitHub への問い合わせが起きた印）、api にだけ login を出して成功する。
 * それ以外（release view / create / upload）は失敗させ、画像の読み取りが退行しても
 * 本物の src/content/photos/ に YAML が書かれないようにする。
 * PATH は偽の gh のディレクトリだけにして、本物の gh に落ちないようにする。
 * login はシングルクォートでそのまま埋め込むので、改行を含めれば複数行になる
 */
function runPhotoAdd(
  args: string[],
  { file = '', login = 'joe-yama' }: { file?: string | Buffer; login?: string } = {},
) {
  const dir = mkdtempSync(join(tmpdir(), 'photo-add-cli-'));
  dirs.push(dir);
  const ghLog = join(dir, 'gh.log');
  const gh = join(dir, 'gh');
  writeFileSync(
    gh,
    `#!/bin/sh\necho "$*" >> '${ghLog}'\ncase "$1" in\n  api) printf '%s\\n' '${login}' ;;\n  *) exit 1 ;;\nesac\n`,
  );
  chmodSync(gh, 0o755);
  writeFileSync(join(dir, 'x.jpg'), file);
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, PATH: dir },
  });
  return {
    status: result.status,
    lines: result.stderr.trim().split('\n'),
    stderr: result.stderr,
    ghCalls: existsSync(ghLog) ? readFileSync(ghLog, 'utf8').trim().split('\n') : [],
  };
}

describe('pnpm photo:add の引数の誤り', () => {
  it.each(['../../x', 'kamo-river.', 'a/b'])(
    '--slug %s は GitHub に問い合わせる前に 1 行で中断し、スタックトレースを出さない',
    (slug) => {
      const r = runPhotoAdd(['x.jpg', '--slug', slug]);
      expect(r.status).toBe(1);
      expect(r.ghCalls).toEqual([]);
      expect(r.lines).toHaveLength(1);
      expect(r.lines[0]).toMatch(/^photo:add: /);
      expect(r.lines[0]).toContain(slug);
      expect(r.stderr).not.toMatch(/^\s+at /m);
    },
  );

  it('未知のオプションは、そのことを示す 1 行と使い方を出して GitHub に問い合わせる前に中断する', () => {
    const r = runPhotoAdd(['x.jpg', '--sulg', 'kamo']);
    expect(r.status).toBe(1);
    expect(r.ghCalls).toEqual([]);
    expect(r.lines).toEqual([expect.stringMatching(/^photo:add: .*--sulg/), USAGE]);
    expect(r.stderr).not.toMatch(/^\s+at /m);
  });

  it('- で始まる --slug の値は、parseArgs の複数行の理由を 1 行にたたみ、使い方と合わせて 2 行で中断する', () => {
    const r = runPhotoAdd(['x.jpg', '--slug', '-x']);
    expect(r.status).toBe(1);
    expect(r.ghCalls).toEqual([]);
    expect(r.lines).toEqual([expect.stringMatching(/^photo:add: .*--slug/), USAGE]);
    expect(r.stderr).not.toMatch(/^\s+at /m);
  });
});

describe('pnpm photo:add のアカウント確認', () => {
  it('gh のアカウント名が複数行でも、中断の理由は 1 行になる', () => {
    const r = runPhotoAdd(['x.jpg'], { login: 'someone\nextra' });
    expect(r.status).toBe(1);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]).toMatch(/^photo:add: gh のアカウントが joe-yama ではない（someone）/);
    expect(r.ghCalls).toEqual(['api user --jq .login']);
  });
});

describe('pnpm photo:add の画像の読み取り', () => {
  it('画像でないファイルは 1 行で中断し、読み取り部品の内部情報を出さず、Release に触れない', () => {
    const r = runPhotoAdd(['x.jpg'], { file: 'hello\n' });
    expect(r.status).toBe(1);
    expect(r.lines).toEqual([expect.stringMatching(/^photo:add: 画像として読めない: x\.jpg$/)]);
    expect(r.stderr).not.toMatch(/^\s+at /m);
    expect(r.stderr).not.toMatch(/exifr|sharp|node_modules/);
    expect(r.ghCalls).toEqual(['api user --jq .login']);
  });

  it('EXIF は読めても画素が壊れた JPEG は、縮小の失敗を 1 行で中断し、sharp の内部情報を出さない', async () => {
    const full = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#888888' },
    })
      .withExif({
        IFD0: { Make: 'FUJIFILM', Model: 'X-T5' },
        IFD2: {
          LensModel: 'XF23mm',
          FNumber: '28/10',
          ExposureTime: '1/250',
          ISOSpeedRatings: '200',
          DateTimeOriginal: '2025:01:02 03:04:05',
        },
      })
      .jpeg()
      .toBuffer();
    // SOS（FF DA）の直後 4 バイトで切る。EXIF（APP1）は残り、画素のデータが欠ける
    const sos = full.indexOf(Buffer.from([0xff, 0xda]));
    const r = runPhotoAdd(['x.jpg'], { file: full.subarray(0, sos + 4) });
    expect(r.status).toBe(1);
    expect(r.lines).toEqual(['photo:add: 画像として読めない: x.jpg']);
    expect(r.stderr).not.toMatch(/sharp|vips|node_modules/i);
    expect(r.stderr).not.toMatch(/^\s+at /m);
    expect(r.ghCalls).toEqual(['api user --jq .login']);
  });

  it('レンズ情報を持たない JPEG は「レンズ」を挙げて 1 行で中断する', async () => {
    const jpeg = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#888888' },
    })
      .jpeg()
      .toBuffer();
    const r = runPhotoAdd(['x.jpg'], { file: jpeg });
    expect(r.status).toBe(1);
    expect(r.lines).toHaveLength(1);
    expect(r.lines[0]).toMatch(/^photo:add: 撮影情報を読み取れない項目がある: .*レンズ/);
    expect(r.ghCalls).toEqual(['api user --jq .login']);
  });
});
