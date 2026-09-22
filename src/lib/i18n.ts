export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ja';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ja' ? 'en' : 'ja';
}

/** base を `/portfolio/` の形（先頭と末尾にスラッシュ 1 つずつ）に正規化する */
function normalizeBase(base: string): string {
  const trimmed = base.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

/** 公開時のパス接頭辞を取り除いた絶対パスを返す。付いていなければそのまま返す */
export function stripBase(path: string, base: string): string {
  const prefix = normalizeBase(base);
  if (prefix === '/') return path;
  return path.startsWith(prefix) ? `/${path.slice(prefix.length)}` : path;
}

/** 公開時のパス接頭辞を前置した絶対パスを返す。既に付いていれば二重に付けない */
export function withBase(path: string, base: string): string {
  const prefix = normalizeBase(base);
  if (prefix === '/') return path;
  if (path === prefix || path.startsWith(prefix)) return path;
  return `${prefix.slice(0, -1)}${path}`;
}

/** 先頭セグメントがロケールならそれを返す。base は取り除いてから見る */
export function localeFromPath(path: string, base: string): Locale | null {
  const first = stripBase(path, base).split('/').filter(Boolean)[0];
  return first !== undefined && isLocale(first) ? first : null;
}

/** 同じページの他言語版のパス。base は保つ */
export function alternatePath(path: string, target: Locale, base: string): string {
  const segments = stripBase(path, base).split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = target;
  } else {
    segments.unshift(target);
  }
  return withBase(`/${segments.join('/')}/`, base);
}

/** `Astro.params.lang` をロケールに絞る。無検査キャスト（`as Locale`）を各ページに複製しないために置く */
export function toLocale(value: string | undefined): Locale {
  if (value !== undefined && isLocale(value)) return value;
  throw new Error(`ロケールではない値がページに渡された: ${JSON.stringify(value)}`);
}
