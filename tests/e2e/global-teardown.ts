import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { RUN_ID_ENV, STARTED_MARKER } from './global-setup';

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
  // globalSetup が「既に別の配信サーバーが動いている」ため例外を投げた実行では、
  // process.env[RUN_ID_ENV] は設定されない。この実行の runId が無ければ、
  // 自分は preview を起動していないということなので、マーカーにも他人の
  // preview にも一切触れない（レビュー I1）。
  const runId = process.env[RUN_ID_ENV];
  if (!runId) return;
  if (!existsSync(STARTED_MARKER)) return;

  let marker: { pid?: unknown; runId?: unknown };
  try {
    marker = JSON.parse(readFileSync(STARTED_MARKER, 'utf-8')) as {
      pid?: unknown;
      runId?: unknown;
    };
  } catch {
    return;
  }

  // マーカーの runId が自分の実行と一致しないときは、同じ worktree で走った
  // 別の `pnpm e2e` 実行（先発・後発どちらもありうる）が書いたものなので、
  // 消さない・触らない。
  if (marker.runId !== runId) return;

  // globalSetup が例外を投げた実行でも Playwright は globalTeardown を呼ぶが、
  // その場合はここまでに runId が一致せず return している。ここに来るのは
  // 自分の globalSetup が実際に preview を起動した実行だけであり、かつ今
  // 動いている preview の pid が自分が起動したものと一致するときだけ止める
  // （レビュー C2）。
  const startedPid = typeof marker.pid === 'number' ? marker.pid : null;
  if (startedPid === null || startedPid !== currentPreviewPid()) return;

  rmSync(STARTED_MARKER);
  execSync('pnpm exec astro preview stop', { stdio: 'inherit' });
}
