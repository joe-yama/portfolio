import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// global-setup.ts が実際に起動したときだけ立てる、pid 入りのマーカー。
const STARTED_MARKER = fileURLToPath(
  new URL('../../.astro/e2e-preview-started-by-setup', import.meta.url),
);

/** 今動いている preview の pid。動いていない・判定できないときは null。 */
function currentPreviewPid(): number | null {
  let output: string;
  try {
    output = execSync('pnpm exec astro preview status --json', { encoding: 'utf-8' });
  } catch {
    return null;
  }
  try {
    const { message } = JSON.parse(output.trim()) as { message?: unknown };
    const match = typeof message === 'string' ? message.match(/pid (\d+)/) : null;
    return match?.[1] ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

export default function globalTeardown(): void {
  if (!existsSync(STARTED_MARKER)) return;

  let startedPid: number | null = null;
  try {
    const marker = JSON.parse(readFileSync(STARTED_MARKER, 'utf-8')) as { pid?: unknown };
    startedPid = typeof marker.pid === 'number' ? marker.pid : null;
  } catch {
    startedPid = null;
  }
  rmSync(STARTED_MARKER);

  // globalSetup が例外を投げた実行でも Playwright は globalTeardown を呼ぶため、
  // 古い実行の残骸のマーカーや、他人が起動した preview が残っていることがある。
  // 自分が記録した pid と、今動いている preview の pid が一致するときだけ止める
  // （レビュー C2。判定できないときも止めない）。
  if (startedPid === null || startedPid !== currentPreviewPid()) return;

  execSync('pnpm exec astro preview stop', { stdio: 'inherit' });
}
