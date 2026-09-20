// 入稿コマンド（scripts/photo-add.ts）が使う変換規則。純粋関数だけを置く。
// node が直接実行する経路に乗るので、相対 import には .ts を付ける（Node の ESM 解決は拡張子を補わない）
import { PLACEHOLDER } from './validate.ts';

export type RawExif = Record<string, unknown>;

export type PhotoMeta = {
  slug: string;
  /** YYYY-MM-DD */
  takenAt: string;
  camera: string;
  lens: string;
  aperture: number;
  shutterSpeed: string;
  iso: number;
};

/** ファイル名 → slug。英数字が残らない場合は --slug を使わせる */
export function toSlug(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug === '')
    throw new Error(`ファイル名から slug を作れない。--slug で指定する: ${fileName}`);
  return slug;
}

/** exifr の ExposureTime（秒の数値）→ 表示用の文字列。0.004 → 1/250、2 → 2s */
export function formatShutterSpeed(seconds: number): string {
  if (!(seconds > 0)) throw new Error(`シャッター速度が正の数ではない: ${seconds}`);
  if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`;
  return `1/${Math.round(1 / seconds)}`;
}

/**
 * 撮影日時 → YYYY-MM-DD。EXIF の DateTimeOriginal はタイムゾーンを持たず、
 * exifr はローカル時刻の Date を返す。UTC に直すと撮影日がずれるのでローカルのまま読む
 */
export function formatTakenAtYmd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function cameraName(make: string, model: string): string {
  const m = model.trim();
  const k = make.trim();
  return m.toLowerCase().startsWith(k.toLowerCase()) ? m : `${k} ${m}`;
}

/** EXIF の生の値 → YAML に書く値。欠けている項目があれば名前を全部挙げて返す */
export function exifToPhotoMeta(
  raw: RawExif,
  slug: string,
): { ok: true; meta: PhotoMeta } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  const takenAt = raw.DateTimeOriginal;
  const make = raw.Make;
  const model = raw.Model;
  const lens = raw.LensModel;
  const aperture = raw.FNumber;
  const exposure = raw.ExposureTime;
  const iso = raw.ISO;

  if (!(takenAt instanceof Date)) missing.push('DateTimeOriginal');
  if (typeof make !== 'string' || make.trim() === '') missing.push('Make');
  if (typeof model !== 'string' || model.trim() === '') missing.push('Model');
  if (typeof lens !== 'string' || lens.trim() === '') missing.push('LensModel');
  if (typeof aperture !== 'number') missing.push('FNumber');
  if (typeof exposure !== 'number') missing.push('ExposureTime');
  if (typeof iso !== 'number') missing.push('ISO');
  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    meta: {
      slug,
      takenAt: formatTakenAtYmd(takenAt as Date),
      camera: cameraName(make as string, model as string),
      lens: (lens as string).trim(),
      aperture: aperture as number,
      shutterSpeed: formatShutterSpeed(exposure as number),
      iso: iso as number,
    },
  };
}

/** 既存の order より後ろの値。10 刻みにして後から間に挿し込めるようにする */
export function nextOrder(orders: number[]): number {
  return orders.length === 0 ? 10 : Math.max(...orders) + 10;
}

/** YAML の二重引用符スカラーは JSON の文字列と同じ規則なので、JSON.stringify で正しく囲める */
const q = (s: string) => JSON.stringify(s);

export function renderPhotoYaml(
  meta: PhotoMeta,
  imageUrl: string,
  order: number,
  featured: boolean,
): string {
  const todo = (ja: string, en: string) =>
    `{ ja: ${q(`${PLACEHOLDER} ${ja}`)}, en: ${q(`${PLACEHOLDER} ${en}`)} }`;
  return `image: ${q(imageUrl)}
order: ${order}
featured: ${featured}
takenAt: ${meta.takenAt}
title: ${todo('日本語のタイトル', 'English title')}
location: ${todo('撮影地', 'Location')}
alt: ${todo('日本語の代替テキスト', 'English alt text')}
exif:
  camera: ${q(meta.camera)}
  lens: ${q(meta.lens)}
  aperture: ${meta.aperture}
  shutterSpeed: ${q(meta.shutterSpeed)}
  iso: ${meta.iso}
`;
}
