// Task 5 の photo-meta.ts がこのファイルから PLACEHOLDER を読み、そちらは node が直接実行する
// 経路に乗る。Node の ESM 解決は拡張子を補わないので、ここだけ .ts を明示する（計画の落とし穴 5）
import { type Career, PHOTO_BASE_URL, type Photo } from '../content/schemas.ts';

export type PhotoEntry = { id: string; data: Photo };

/** 入稿コマンドが title / location / alt に入れる未記入の印 */
export const PLACEHOLDER = 'TODO:';

/** Zod で表せない写真コレクション全体の制約。問題点を文字列で返す（空 = OK） */
export function validatePhotos(entries: PhotoEntry[]): string[] {
  if (entries.length === 0) return [];

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
 * 日英の経歴で、並べて表示する項目の対応が取れていること。
 * `experience` / `certifications` / `achievements` / `patents`（配列）は件数が一致することを、
 * `certifications` / `achievements` / `patents` はさらに同じ位置にある項目の比較キー
 * （表示の並び替えに使う値。日英で書かれた位置が対応するため）が一致することを見る。
 * `skills` は配列ではなく Record（カテゴリ名 → 項目の配列）なので、カテゴリ数と
 * 各カテゴリの項目数を見る。件数が違う配列は、比較キーの突き合わせまで進まない
 */
export function validateCareerParity(ja: Career, en: Career): string[] {
  const errors: string[] = [];
  for (const key of ['experience', 'certifications', 'achievements', 'patents'] as const) {
    if (ja[key].length !== en[key].length) {
      errors.push(`${key} の件数が日英で違う（ja: ${ja[key].length}, en: ${en[key].length}）`);
    }
  }

  // certifications / achievements は同じ位置の date が対応づけの比較キー（表示は
  // date の安定ソートで並ぶため）。件数が違う配列は比較まで進まない
  for (const key of ['certifications', 'achievements'] as const) {
    if (ja[key].length !== en[key].length) continue;
    ja[key].forEach((jaItem, index) => {
      const enItem = en[key][index];
      if (jaItem.date !== enItem.date) {
        errors.push(
          `${key} の ${index + 1} 番目の date が日英で違う（ja: ${jaItem.date}, en: ${enItem.date}）`,
        );
      }
    });
  }

  // patents は countries の件数と filedAt の組が比較キー
  if (ja.patents.length === en.patents.length) {
    ja.patents.forEach((jaItem, index) => {
      const enItem = en.patents[index];
      if (
        jaItem.countries.length !== enItem.countries.length ||
        jaItem.filedAt !== enItem.filedAt
      ) {
        errors.push(
          `patents の ${index + 1} 番目が日英で違う（ja: countries ${jaItem.countries.length} 件 / filedAt ${jaItem.filedAt}, en: countries ${enItem.countries.length} 件 / filedAt ${enItem.filedAt}）`,
        );
      }
    });
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

export function assertValid(errors: string[], subject: string): void {
  if (errors.length === 0) return;
  throw new Error(`${subject} の内容に問題がある:\n- ${errors.join('\n- ')}`);
}
