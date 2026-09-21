import { execSync } from 'node:child_process';
import { baseURL, PORT } from '../../playwright.config';

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 60_000;

function describeFetchFailure(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? error.cause.message : error.cause;
    return cause ? `${error.message} (cause: ${cause})` : error.message;
  }
  return String(error);
}

async function waitForServerReady(): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastFailure = '(fetch を一度も試みなかった)';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseURL);
      if (response.status === 200) {
        return;
      }
      lastFailure = `HTTP ${response.status} が返った`;
    } catch (error) {
      // まだサーバーが起動していない（接続拒否など）。理由を保持してリトライする。
      lastFailure = describeFetchFailure(error);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  let logs: string;
  try {
    logs = execSync('pnpm exec astro preview logs', { encoding: 'utf-8' });
  } catch (error) {
    logs = error instanceof Error ? error.message : String(error);
  }
  throw new Error(
    `astro preview が ${POLL_TIMEOUT_MS}ms 以内に ${baseURL} で 200 を返さなかった。\n` +
      `最後の fetch 失敗: ${lastFailure}\nlogs:\n${logs}`,
  );
}

export default async function globalSetup(): Promise<void> {
  execSync('pnpm build', { stdio: 'inherit' });
  // astro preview は CI（非対話端末）では前景実行になり execSync がブロックする。
  // --background を明示してバックグラウンドプロセスとして起動し、
  // 起動コマンドが戻った後は HTTP でポーリングして起動完了を待つ。
  // --host 127.0.0.1 は既定の `localhost` バインドが CI（ubuntu runner）で
  // IPv6 の ::1 にのみ解決され、baseURL の 127.0.0.1（IPv4）宛の接続が
  // 拒否される問題への対処（仮説。macOS では localhost が 127.0.0.1 に
  // 解決されるためローカルでは再現しない）。
  execSync(`pnpm exec astro preview --port ${PORT} --host 127.0.0.1 --background`, {
    stdio: 'inherit',
  });
  await waitForServerReady();
}
