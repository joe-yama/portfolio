import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// global-setup.ts が実際に起動したときだけ立てるマーカー。無ければ自分は
// 配信サーバーを起動していない（既に動いていたので global-setup が例外を投げた）
// ということなので、他人のサーバーを止めない。
const STARTED_MARKER = fileURLToPath(
  new URL('../../.astro/e2e-preview-started-by-setup', import.meta.url),
);

export default function globalTeardown(): void {
  if (!existsSync(STARTED_MARKER)) return;
  rmSync(STARTED_MARKER);
  execSync('pnpm exec astro preview stop', { stdio: 'inherit' });
}
