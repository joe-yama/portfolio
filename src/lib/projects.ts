import type { ProjectEntry } from '../content/schemas';
import type { Locale } from './i18n';

/** 開発物を order の小さい順に並べた新しい配列を返す（入力は変えない） */
export function sortProjects(entries: ProjectEntry[]): ProjectEntry[] {
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}

/** 開始年の表示。日本語は `2026年〜`、英語は `2026–`（spec projects） */
export function sinceLabel(year: number, lang: Locale): string {
  return lang === 'ja' ? `${year}年〜` : `${year}–`;
}
