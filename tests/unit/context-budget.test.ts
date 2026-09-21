import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 毎セッション無条件にコンテキストへ載るファイルの予算。
 *
 * CLAUDE.md は誰にも測られないまま 21,651 B まで育った（2026-09-22 に 7 KB 台へ削減）。
 * 「200 行を超えない」という docs/HANDOFF.md §3-4 のルールは、実行されなかったので効かなかった。
 * 上限を上げるときは、なぜ上げるかをコミットメッセージに残す。
 */
const BUDGET_BYTES = 20_000;

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const RULES_DIR = '.claude/rules';

/** CLAUDE.md と .claude/rules/*.md は Claude Code がセッション開始時に全文を読む。 */
function autoLoadedFiles(): string[] {
  const rules = readdirSync(join(ROOT, RULES_DIR))
    .filter((name) => name.endsWith('.md'))
    .map((name) => join(RULES_DIR, name))
    .sort();
  return ['CLAUDE.md', ...rules];
}

describe('毎セッションの自動ロード', () => {
  it('数える対象を取りこぼしていない', () => {
    // 対象が 0 件になっても予算検査が緑のまま、という壊れ方を防ぐ
    const files = autoLoadedFiles();
    expect(files).toContain('CLAUDE.md');
    expect(files.filter((file) => file.startsWith(RULES_DIR))).toHaveLength(5);
  });

  it(`合計が ${BUDGET_BYTES} バイト以下`, () => {
    const sizes = autoLoadedFiles().map((file) => [file, statSync(join(ROOT, file)).size] as const);
    const total = sizes.reduce((sum, [, size]) => sum + size, 0);
    const breakdown = sizes.map(([file, size]) => `  ${file}: ${size} B`).join('\n');

    expect(
      total,
      [
        `毎セッションの自動ロードが予算 ${BUDGET_BYTES} B を超えている（現在 ${total} B）。`,
        breakdown,
        '削るか、docs/ へ出して CLAUDE.md の索引に 1 行で置き換える。',
        '上限を上げるなら、その理由をコミットメッセージに書いてから BUDGET_BYTES を変える。',
      ].join('\n'),
    ).toBeLessThanOrEqual(BUDGET_BYTES);
  });
});
