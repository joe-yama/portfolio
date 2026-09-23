import type { Career } from '../content/schemas';
import type { Locale } from './i18n';

/** 文字列の降順の比較関数（等しければ 0 で、toSorted の安定ソートが記述順を保つ） */
const desc = (a: string, b: string) => (b > a ? 1 : b < a ? -1 : 0);

/** 職歴を from の新しい順に並べた新しい配列を返す */
export function sortExperience(experience: Career['experience']): Career['experience'] {
  return experience.toSorted((a, b) => desc(a.from, b.from));
}

/** date が日まで含むか（`YYYY-MM-DD`）。`YYYY-MM` なら false（design D9） */
export function hasDay(date: string): boolean {
  return date.split('-').length === 3;
}

/** 並べ替えの比較キー。年月までの日付はその月の 1 日として扱う（design D2） */
function dateSortKey(date: string): string {
  return hasDay(date) ? date : `${date}-01`;
}

/** 日付を持つ項目を date の新しい順に並べた新しい配列を返す（資格と実績で共用） */
export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return items.toSorted((a, b) => desc(dateSortKey(a.date), dateSortKey(b.date)));
}

/** 出願国数の降順、同数なら filedAt の新しい順（どちらも同じなら記述順）に並べた新しい配列を返す */
export function sortPatents(patents: Career['patents']): Career['patents'] {
  return patents.toSorted((a, b) => {
    const byCountryCount = b.countries.length - a.countries.length;
    if (byCountryCount !== 0) return byCountryCount;
    return desc(a.filedAt, b.filedAt);
  });
}

/** 特許の一覧で、操作なしに見せる先頭の件数（spec） */
const PATENTS_HEAD_COUNT = 5;

/** 先頭 5 件（head）とそれ以降（rest）に分ける。並び替えは呼び出し側の責務 */
export function splitPatents(
  patents: Career['patents'],
): Record<'head' | 'rest', Career['patents']> {
  return { head: patents.slice(0, PATENTS_HEAD_COUNT), rest: patents.slice(PATENTS_HEAD_COUNT) };
}

/**
 * `YYYY-MM` / `YYYY-MM-DD` をローカル時刻の Date にする。
 * `new Date('2020-04')` は UTC 基準で解釈され、負のオフセットの環境で前月になる
 */
function toLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined) throw new Error(`日付の形式が違う: ${value}`);
  return new Date(year, month - 1, day ?? 1);
}

/** 年月（`YYYY-MM`）の表記。ja: `2021年3月`、en: `Mar 2021` */
export function formatMonth(value: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    // ja は 'long' と 'short' で表記が同じ（どちらも `3月`）ため死んだ分岐だった
    month: 'short',
  }).format(toLocalDate(value));
}

/**
 * 職歴の期間。ja: `2020年4月 – 現在`、en: `Apr 2020 – Present`。
 * 在職中（to が無い）の終わりの表記は呼び出し側が渡す（design D10、`ui[lang].present`）
 */
export function formatPeriod(
  from: string,
  to: string | null | undefined,
  lang: Locale,
  present: string,
): string {
  return `${formatMonth(from, lang)} – ${to ? formatMonth(to, lang) : present}`;
}

/**
 * 資格・実績の日付。書かれた粒度のまま出す（design D3）。
 * ja: `2023年6月1日` / `2025年10月`、en: `June 1, 2023` / `October 2025`
 */
export function formatDate(date: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    day: hasDay(date) ? 'numeric' : undefined,
  }).format(toLocalDate(date));
}

type Certification = Career['certifications'][number];

export type CertificationEntry =
  | { kind: 'single'; item: Certification }
  | { kind: 'group'; name: string; items: Certification[] };

/**
 * 同じ group の資格を 1 項目にまとめる（design D3）。入力は sortByDateDesc 済みなので、
 * グループが初めて出てきた位置がそのグループで最も新しい date の位置になる
 */
export function groupCertifications(sorted: Certification[]): CertificationEntry[] {
  const entries: CertificationEntry[] = [];
  const groups = new Map<string, Certification[]>();
  for (const item of sorted) {
    if (item.group === undefined) {
      entries.push({ kind: 'single', item });
      continue;
    }
    const items = groups.get(item.group);
    if (items) {
      items.push(item);
    } else {
      const created = [item];
      groups.set(item.group, created);
      entries.push({ kind: 'group', name: item.group, items: created });
    }
  }
  return entries;
}

/** まとめた資格の期間。items は新しい順。ja: `2025年4月 – 2025年10月`、同じ表記なら 1 つだけ */
export function formatGroupPeriod(items: { date: string }[], lang: Locale): string {
  const newest = formatDate(items[0].date, lang);
  const oldest = formatDate(items[items.length - 1].date, lang);
  return oldest === newest ? newest : `${oldest} – ${newest}`;
}
