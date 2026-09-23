import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SCRIPT = fileURLToPath(new URL('../../scripts/photo-add.ts', import.meta.url));
const USAGE = '使い方: pnpm photo:add <画像ファイル> [--slug <名前>]';

/**
 * 一時ディレクトリを cwd にして pnpm photo:add 相当を実行する。gh は偽物で、
 * 呼ばれたら gh.log に引数を書く（= GitHub への問い合わせが起きた印）
 */
function runPhotoAdd(args: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'photo-add-cli-'));
  const ghLog = join(dir, 'gh.log');
  const gh = join(dir, 'gh');
  writeFileSync(gh, `#!/bin/sh\necho "$*" >> "${ghLog}"\necho joe-yama\n`);
  chmodSync(gh, 0o755);
  writeFileSync(join(dir, 'x.jpg'), ''); // 存在する画像ファイル（中身は読まれる前に止まる）
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ''}` },
  });
  return {
    status: result.status,
    lines: result.stderr.trim().split('\n'),
    stderr: result.stderr,
    ghCalled: existsSync(ghLog),
  };
}

describe('pnpm photo:add の引数の誤り', () => {
  it.each(['../../x', 'kamo-river.'])(
    '--slug %s は GitHub に問い合わせる前に 1 行で中断し、スタックトレースを出さない',
    (slug) => {
      const r = runPhotoAdd(['x.jpg', '--slug', slug]);
      expect(r.status).toBe(1);
      expect(r.ghCalled).toBe(false);
      expect(r.lines).toHaveLength(1);
      expect(r.lines[0]).toMatch(/^photo:add: /);
      expect(r.lines[0]).toContain(slug);
      expect(r.stderr).not.toMatch(/^\s+at /m);
    },
  );

  it('未知のオプションは、そのことを示す 1 行と使い方を出して GitHub に問い合わせる前に中断する', () => {
    const r = runPhotoAdd(['x.jpg', '--sulg', 'kamo']);
    expect(r.status).toBe(1);
    expect(r.ghCalled).toBe(false);
    expect(r.lines).toEqual([expect.stringMatching(/^photo:add: .*--sulg/), USAGE]);
    expect(r.stderr).not.toMatch(/^\s+at /m);
  });

  it('- で始まる --slug の値は、parseArgs の複数行の理由を 1 行にたたみ、使い方と合わせて 2 行で中断する', () => {
    const r = runPhotoAdd(['x.jpg', '--slug', '-x']);
    expect(r.status).toBe(1);
    expect(r.ghCalled).toBe(false);
    expect(r.lines).toEqual([expect.stringMatching(/^photo:add: .*--slug/), USAGE]);
    expect(r.stderr).not.toMatch(/^\s+at /m);
  });
});
