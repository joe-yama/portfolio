import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseURL, PORT } from '../../playwright.config';

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 60_000;
const PORT_CHECK_TIMEOUT_MS = 1_000;

// リポジトリの root。preview はプロジェクト root ごとのロックなので、build・preview・
// status・logs・stop をすべてここで実行し、呼び出し元の cwd に左右されないようにする
export const ROOT = fileURLToPath(new URL('../..', import.meta.url));

// setup が実際に起動した preview の pid を global-teardown.ts に伝えるマーカー。
// globalSetup と globalTeardown は別のモジュール評価になりうるため、
// モジュールスコープの変数ではなくファイル（.astro/ 配下。git 管理外）で受け渡す。
export const STARTED_MARKER = fileURLToPath(
  new URL('../../.astro/e2e-preview-started-by-setup', import.meta.url),
);

// このプロセス（1 回の `pnpm e2e` 実行）の識別子を渡す環境変数。globalSetup と
// globalTeardown は別モジュール評価だが同じプロセス内で呼ばれるため、
// process.env は共有される。マーカーファイル自体はプロセスをまたいで残り続ける
// （同じ worktree で 2 本目の `pnpm e2e` を回したときなど）ため、pid の一致だけ
// では「今回自分が起動した preview か」を区別できない（レビュー I1）。
// teardown は、この環境変数（＝自分の実行の runId）とマーカーの runId の両方が
// 一致したときだけ、マーカーの削除と `astro preview stop` を行う。
export const RUN_ID_ENV = 'E2E_PREVIEW_RUN_ID';

/** astro preview の status/start の --json 出力から動作中の message を取り出す。動いていなければ null。 */
function parsePreviewMessage(output: string): string | null {
  try {
    const { message } = JSON.parse(output.trim()) as { message?: unknown };
    if (typeof message !== 'string' || message.includes('No preview server is running')) {
      return null;
    }
    return message;
  } catch {
    return null;
  }
}

/** status --json の出力から動作中の preview の pid を取り出す。動いていなければ null。 */
function parsePreviewPid(output: string): number | null {
  const match = parsePreviewMessage(output)?.match(/pid (\d+)/);
  return match?.[1] ? Number(match[1]) : null;
}

/** 今動いている preview の pid。動いていない・判定できないときは null（setup と teardown で共用） */
export function currentPreviewPid(): number | null {
  try {
    return parsePreviewPid(
      execSync('pnpm exec astro preview status --json', { cwd: ROOT, encoding: 'utf-8' }),
    );
  } catch {
    return null;
  }
}

// baseURL（このリポジトリの preview が使うポート）に何か応答するプロセスがいれば、
// astro 以外の別プロセス・別ディレクトリの配信サーバーであっても占有とみなす。
// astro preview status はプロジェクト root ごとのロックしか見ないため、これが無いと
// 別プロセスの静的サーバーをすり抜けて検査してしまう（レビュー C1 の実測）。
async function isPortOccupied(): Promise<boolean> {
  try {
    await fetch(baseURL, { signal: AbortSignal.timeout(PORT_CHECK_TIMEOUT_MS) });
    return true;
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
    logs = execSync('pnpm exec astro preview logs', { cwd: ROOT, encoding: 'utf-8' });
  } catch (error) {
    logs = error instanceof Error ? error.message : String(error);
  }
  throw new Error(
    `astro preview が ${POLL_TIMEOUT_MS}ms 以内に ${baseURL} で 200 を返さなかった。\n` +
      `最後の fetch 失敗: ${lastFailure}\nlogs:\n${logs}`,
  );
}

export default async function globalSetup(): Promise<void> {
  // 同じプロジェクト root の preview が別ポートで動いていると --port が無視されて 60 秒待つので、
  // 先に落とす補助チェック。別 root・別プロセスの占有は isPortOccupied が見る（レビュー C1）。
  // `astro preview status` は起動の有無によらず exit 0 で終わるので、終了コードではなく
  // `--json` の `message` を見る（起動中の message は常に `pid N` を含む）
  if (currentPreviewPid() !== null || (await isPortOccupied())) {
    throw new Error(
      '既に別の配信サーバーが動いている。このリポジトリの dist とは限らないため、' +
        '検査を開始せずに終了する。`pnpm exec astro preview stop` で停止してから再実行すること。',
    );
  }

  execSync('pnpm build', { cwd: ROOT, stdio: 'inherit' });
  // astro preview は CI（非対話端末）では前景実行になり execSync がブロックする。
  // --background を明示してバックグラウンドプロセスとして起動し、
  // 起動コマンドが戻った後は HTTP でポーリングして起動完了を待つ。
  // --host 127.0.0.1 は既定の `localhost` バインドが CI（ubuntu runner）で
  // IPv6 の ::1 にのみ解決され、baseURL の 127.0.0.1（IPv4）宛の接続が
  // 拒否される問題への対処（仮説。macOS では localhost が 127.0.0.1 に
  // 解決されるためローカルでは再現しない）。
  execSync(`pnpm exec astro preview --port ${PORT} --host 127.0.0.1 --background`, {
    cwd: ROOT,
    stdio: 'inherit',
  });

  // 起動した preview 自身の pid と、この実行の runId を記録する（teardown が
  // 「今動いている preview の pid」かつ「自分がこの実行で書いたマーカーか」の
  // 両方を照合するため。レビュー C2 / I1）。
  const pid = currentPreviewPid();
  if (pid === null) {
    throw new Error(
      'astro preview を起動したが pid を取得できなかった。teardown が止められないので検査を始めない。' +
        '`pnpm exec astro preview stop` で停止してから再実行すること。',
    );
  }
  const runId = randomUUID();
  process.env[RUN_ID_ENV] = runId;
  mkdirSync(dirname(STARTED_MARKER), { recursive: true });
  writeFileSync(STARTED_MARKER, JSON.stringify({ pid, runId }));
  await waitForServerReady();
}
