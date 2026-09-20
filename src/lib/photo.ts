import type { Exif } from '../content/schemas';
import type { Locale } from './i18n';

/** 撮影情報の 1 行。`Fujifilm X-T5 · XF 23mm F1.4 · f/1.4 · 1/250 · ISO 800`（設計書 §5.1） */
export function formatExif(exif: Exif): string {
  return [exif.camera, exif.lens, `f/${exif.aperture}`, exif.shutterSpeed, `ISO ${exif.iso}`].join(
    ' · ',
  );
}

const dateLocale: Record<Locale, string> = { ja: 'ja-JP', en: 'en-US' };

/**
 * 撮影日の表示。takenAt は日付だけの値なので UTC で解釈する。
 * ローカル時刻で解釈すると、ビルドするマシンのタイムゾーン次第で 1 日ずれる
 */
export function formatTakenAt(date: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(dateLocale[lang], {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date);
}
