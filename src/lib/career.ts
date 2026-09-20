import type { Career } from '../content/schemas';
import type { Locale } from './i18n';

/** 職歴を from の新しい順に並べた新しい配列を返す */
export function sortExperience(experience: Career['experience']): Career['experience'] {
  return [...experience].sort((a, b) => b.from.localeCompare(a.from));
}

/** 日付を持つ項目を date の新しい順に並べた新しい配列を返す（資格と実績で共用） */
export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

/** 在職中（to が無い）の終わりの表記 */
const present: Record<Locale, string> = { ja: '現在', en: 'Present' };

/**
 * `YYYY-MM` / `YYYY-MM-DD` をローカル時刻の Date にする。
 * `new Date('2020-04')` は UTC 基準で解釈され、負のオフセットの環境で前月になる
 */
function toLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined) throw new Error(`日付の形式が違う: ${value}`);
  return new Date(year, month - 1, day ?? 1);
}

/** 職歴の期間。ja: `2020年4月 – 現在`、en: `Apr 2020 – Present` */
export function formatPeriod(from: string, to: string | null | undefined, lang: Locale): string {
  const format = (value: string) =>
    new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: lang === 'ja' ? 'long' : 'short',
    }).format(toLocalDate(value));
  return `${format(from)} – ${to ? format(to) : present[lang]}`;
}

/** 資格・実績の日付。ja: `2023年6月1日`、en: `June 1, 2023` */
export function formatDate(date: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(toLocalDate(date));
}
