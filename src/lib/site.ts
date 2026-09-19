import { alternatePath, defaultLocale, type Locale, locales, otherLocale } from './i18n';

export type AlternateLink = { hreflang: Locale | 'x-default'; href: string };
export type NavLink = { label: string; href: string };
export type LanguageSwitch = { label: string; href: string; hreflang: Locale };

type UiStrings = { languageName: string; notFound: string; backToTop: string };

/** 画面に出す文字列。ナビの「Photos」「Career」は両言語とも英字なので navLinks に直接書く */
export const ui: Record<Locale, UiStrings> = {
  ja: { languageName: '日本語', notFound: 'ページが見つかりません', backToTop: '日本語のトップへ' },
  en: { languageName: 'English', notFound: 'Page not found', backToTop: 'Go to the English top' },
};

/** hreflang の 3 本。x-default は既定ロケール（ja）と同じ */
export function alternateLinks(path: string, site: string | URL): AlternateLink[] {
  const href = (lang: Locale) => new URL(alternatePath(path, lang), site).href;
  return [
    ...locales.map((lang) => ({ hreflang: lang, href: href(lang) })),
    { hreflang: 'x-default', href: href(defaultLocale) },
  ];
}

export function navLinks(lang: Locale): NavLink[] {
  return [
    { label: 'Photos', href: `/${lang}/photos/` },
    { label: 'Career', href: `/${lang}/career/` },
  ];
}

/** 相手の言語名を表示し、同じページの他言語版へ飛ぶリンク */
export function languageSwitch(path: string, lang: Locale): LanguageSwitch {
  const target = otherLocale(lang);
  return { label: ui[target].languageName, href: alternatePath(path, target), hreflang: target };
}
