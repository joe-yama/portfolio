import { execSync } from 'node:child_process';
import { baseURL, PORT } from '../../playwright.config';

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 60_000;

async function waitForServerReady(): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseURL);
      if (response.status === 200) {
        return;
      }
    } catch {
      // まだサーバーが起動していない（接続拒否）。リトライする。
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
    `astro preview が ${POLL_TIMEOUT_MS}ms 以内に ${baseURL} で 200 を返さなかった。\nlogs:\n${logs}`,
  );
}

export default async function globalSetup(): Promise<void> {
  execSync('pnpm build', { stdio: 'inherit' });
  // astro preview は CI（非対話端末）では前景実行になり execSync がブロックする。
  // --background を明示してバックグラウンドプロセスとして起動し、
  // 起動コマンドが戻った後は HTTP でポーリングして起動完了を待つ。
  execSync(`pnpm exec astro preview --port ${PORT} --background`, { stdio: 'inherit' });
  await waitForServerReady();
}
