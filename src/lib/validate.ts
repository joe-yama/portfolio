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

/** 日英の経歴で、並べて表示する配列の件数が一致すること */
export function validateCareerParity(ja: Career, en: Career): string[] {
  const errors: string[] = [];
  for (const key of ['experience', 'certifications', 'achievements'] as const) {
    if (ja[key].length !== en[key].length) {
      errors.push(`${key} の件数が日英で違う（ja: ${ja[key].length}, en: ${en[key].length}）`);
    }
  }
  return errors;
}

export function assertValid(errors: string[], subject: string): void {
  if (errors.length === 0) return;
  throw new Error(`${subject} の内容に問題がある:\n- ${errors.join('\n- ')}`);
}
