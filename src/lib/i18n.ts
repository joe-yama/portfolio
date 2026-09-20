export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ja' ? 'en' : 'ja';
}

/** 先頭セグメントがロケールならそれを返す。`/ja/photos/` → 'ja'、`/photos/` → null */
export function localeFromPath(path: string): Locale | null {
  const first = path.split('/').filter(Boolean)[0];
  return first !== undefined && isLocale(first) ? first : null;
}

/** 同じページの他言語版のパス。`/ja/photos/x/` + 'en' → `/en/photos/x/` */
export function alternatePath(path: string, target: Locale): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = target;
  } else {
    segments.unshift(target);
  }
  return `/${segments.join('/')}/`;
}

/**
 * ページの `Astro.params.lang` をロケールに絞る。getStaticPaths が locales しか返さないので
 * 実行時に外れることは無いが、無検査キャスト（`as Locale`）を各ページに複製しないために置く
 */
export function toLocale(value: string | undefined): Locale {
  if (value !== undefined && isLocale(value)) return value;
  throw new Error(`ロケールではない値がページに渡された: ${String(value)}`);
}
