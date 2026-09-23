// photo-meta.ts（入稿コマンドが node で直接実行する経路）がこのファイルを import する。
// Node の ESM 解決は拡張子を補わないので、相対 import に .ts を付ける
import { type Career, PHOTO_BASE_URL, type PhotoEntry } from '../content/schemas.ts';
import type { Locale } from './i18n.ts';

/** 入稿コマンドが title / location / alt に入れる未記入の印 */
export const PLACEHOLDER = 'TODO:';

/**
 * Zod で表せない写真コレクション全体の制約。問題点を文字列で返す（空 = OK）。
 * 0 枚も featured の不足として報告する（spec content-schema）
 */
export function validatePhotos(entries: PhotoEntry[]): string[] {
  const errors: string[] = [];

  const featured = entries.filter((e) => e.data.featured).map((e) => e.id);
  if (featured.length !== 1) {
    errors.push(
      `featured はちょうど 1 枚にする（現在 ${featured.length} 枚: ${featured.join(', ') || 'なし'}）`,
    );
  }

  const byOrder = new Map<number, string[]>();
  for (const e of entries) {
    byOrder.set(e.data.order, [...(byOrder.get(e.data.order) ?? []), e.id]);
  }
  for (const [order, ids] of byOrder) {
    if (ids.length > 1) errors.push(`order ${order} が重複している: ${ids.join(', ')}`);
  }

  for (const e of entries) {
    const expected = `${PHOTO_BASE_URL}${e.id}.jpg`;
    if (e.data.image !== expected) {
      errors.push(`${e.id}: image は ${expected} にする（現在 ${e.data.image}）`);
    }
  }

  // 入稿コマンドが入れる未記入の印。`TODO` だけを見ると `TODO リストの写真` のような
  // 正当なタイトルを弾くので、コロンまで含めて一致させる
  for (const e of entries) {
    for (const field of ['title', 'location', 'alt'] as const) {
      for (const lang of ['ja', 'en'] as const) {
        if (e.data[field][lang].startsWith(PLACEHOLDER)) {
          errors.push(`${e.id}: ${field}.${lang} が未記入（${PLACEHOLDER} のまま）`);
        }
      }
    }
  }

  return errors;
}

/**
 * 同じ位置の項目どうしを突き合わせる配列と、その比較キー（表示の並び替えに使う値）。
 * label はエラー文の「N 番目」の後ろに入る語（patents は複数の値をまとめて出すので空）
 */
const INDEXED_KEYS: [
  key: 'certifications' | 'achievements' | 'patents',
  label: string,
  keyOf: (career: Career, index: number) => string,
][] = [
  ['certifications', 'の date ', (c, i) => c.certifications[i].date],
  ['achievements', 'の date ', (c, i) => c.achievements[i].date],
  [
    'patents',
    '',
    (c, i) => `countries ${c.patents[i].countries.length} 件 / filedAt ${c.patents[i].filedAt}`,
  ],
];

/**
 * 日英の経歴で、並べて表示する項目の対応が取れていること。配列は件数の一致と、
 * INDEXED_KEYS の比較キーの一致を見る。`skills` は配列ではなく Record
 * （カテゴリ名 → 項目の配列）なので、カテゴリ数と各カテゴリの項目数を見る
 */
export function validateCareerParity(ja: Career, en: Career): string[] {
  const errors: string[] = [];
  for (const key of ['experience', 'certifications', 'achievements', 'patents'] as const) {
    if (ja[key].length !== en[key].length) {
      errors.push(`${key} の件数が日英で違う（ja: ${ja[key].length}, en: ${en[key].length}）`);
    }
  }

  // 件数が違う配列は、比較キーの突き合わせまで進まない
  for (const [key, label, keyOf] of INDEXED_KEYS) {
    if (ja[key].length !== en[key].length) continue;
    for (let index = 0; index < ja[key].length; index++) {
      const [jaKey, enKey] = [keyOf(ja, index), keyOf(en, index)];
      if (jaKey !== enKey) {
        errors.push(
          `${key} の ${index + 1} 番目${label}が日英で違う（ja: ${jaKey}, en: ${enKey}）`,
        );
      }
    }
  }

  // skills は配列ではなくカテゴリ名から項目への対応。カテゴリ名は訳語になるので
  // キーでは対応づけられず、表示側（career.astro）と同じ Object.entries の順で対応づける
  const jaSkills = Object.entries(ja.skills);
  const enSkills = Object.entries(en.skills);
  if (jaSkills.length !== enSkills.length) {
    errors.push(
      `skills のカテゴリ数が日英で違う（ja: ${jaSkills.length}, en: ${enSkills.length}）`,
    );
    return errors;
  }
  for (const [index, [jaName, jaItems]] of jaSkills.entries()) {
    const [enName, enItems] = enSkills[index];
    if (jaItems.length !== enItems.length) {
      errors.push(
        `skills の ${index + 1} 番目のカテゴリの項目数が日英で違う（${jaName}: ${jaItems.length}, ${enName}: ${enItems.length}）`,
      );
    }
  }

  return errors;
}

/** 見出し（title）の長さの上限（コードポイント単位）。design D12 */
const PATENT_TITLE_MAX_LENGTH: Record<Locale, number> = { ja: 40, en: 90 };

/**
 * 特許の、1 つの言語のデータの中で閉じる検証。日英を比べる validateCareerParity とは別の関数にする（design D8）。
 * - number が重複しないこと
 * - countries の先頭が number の先頭 2 文字（代表公報の国）と一致すること
 * - title の長さが言語ごとの上限（コードポイント単位）を超えないこと
 */
export function validateCareerPatents(career: Career, lang: Locale): string[] {
  const errors: string[] = [];
  const maxLength = PATENT_TITLE_MAX_LENGTH[lang];
  const seen = new Set<string>();

  for (const patent of career.patents) {
    if (seen.has(patent.number)) {
      errors.push(`${lang}: number が重複している（number: ${patent.number}）`);
    }
    seen.add(patent.number);

    const expectedCountry = patent.number.slice(0, 2);
    if (patent.countries[0] !== expectedCountry) {
      errors.push(
        `${lang}: countries の先頭が代表公報の国と違う（number: ${patent.number}, countries[0]: ${patent.countries[0]}）`,
      );
    }

    const length = [...patent.title].length;
    if (length > maxLength) {
      errors.push(
        `${lang}: title が長すぎる（number: ${patent.number}, ${length} 文字、上限 ${maxLength} 文字）`,
      );
    }
  }

  return errors;
}

export function assertValid(errors: string[], subject: string): void {
  if (errors.length === 0) return;
  throw new Error(`${subject} の内容に問題がある:\n- ${errors.join('\n- ')}`);
}
