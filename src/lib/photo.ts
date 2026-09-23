import type { Exif, PhotoEntry } from '../content/schemas';
import type { Locale } from './i18n';

/** 撮影情報の 1 行。`Fujifilm X-T5 · XF 23mm F1.4 R LM WR · f/1.4 · 1/250 · ISO 800`（設計書 §5.1） */
export function formatExif(exif: Exif): string {
  return [exif.camera, exif.lens, `f/${exif.aperture}`, exif.shutterSpeed, `ISO ${exif.iso}`].join(
    ' · ',
  );
}

/**
 * 撮影日の表示。takenAt は日付だけの値なので UTC で解釈する。
 * ローカル時刻で解釈すると、ビルドするマシンのタイムゾーン次第で 1 日ずれる
 */
export function formatTakenAt(date: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
}

/** slug の写真と、並び順で隣接する写真。端では該当側を undefined にする（PO 決定 2026-09-20） */
export function neighbors(
  photos: PhotoEntry[],
  slug: string,
): { photo: PhotoEntry; prev?: PhotoEntry; next?: PhotoEntry } {
  const i = photos.findIndex((p) => p.id === slug);
  if (i < 0) throw new Error(`並びの中に写真が無い: ${slug}`);
  return {
    photo: photos[i],
    prev: i > 0 ? photos[i - 1] : undefined,
    next: i < photos.length - 1 ? photos[i + 1] : undefined,
  };
}
