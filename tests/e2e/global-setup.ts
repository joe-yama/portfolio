import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseURL, PORT } from '../../playwright.config';

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 60_000;

// setup が実際に配信サーバーを起動したことを global-teardown.ts に伝えるマーカー。
// globalSetup と globalTeardown は別のモジュール評価になりうるため、
// モジュールスコープの変数ではなくファイル（.astro/ 配下。git 管理外）で受け渡す。
const STARTED_MARKER = fileURLToPath(
  new URL('../../.astro/e2e-preview-started-by-setup', import.meta.url),
);

// astro preview status は起動有無にかかわらず終了コード 0 で返る（実測。バージョンで
// 変わりうるため頼らない）。--json で固定した出力の message を見て判定し、判定できない
// （コマンド自体が失敗するなど）ときは「動いていない」側に倒し、起動を試みる。
function isPreviewAlreadyRunning(): boolean {
  let output: string;
  try {
    output = execSync('pnpm exec astro preview status --json', { encoding: 'utf-8' });
  } catch {
    return false;
  }
  try {
    const { message } = JSON.parse(output.trim()) as { message?: unknown };
    return typeof message === 'string' && !message.includes('No preview server is running');
  } catch {
    return false;
  }
}

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
  if (isPreviewAlreadyRunning()) {
    throw new Error(
      '既に別の astro preview サーバーが動いている。このリポジトリの dist とは限らないため、' +
        '検査を開始せずに終了する。`pnpm exec astro preview stop` で停止してから再実行すること。',
    );
  }

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
  mkdirSync(dirname(STARTED_MARKER), { recursive: true });
  writeFileSync(STARTED_MARKER, '');
  await waitForServerReady();
}
