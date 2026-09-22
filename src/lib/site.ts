import type { AchievementKind } from '../content/schemas';
import {
  alternatePath,
  defaultLocale,
  type Locale,
  localeFromPath,
  locales,
  otherLocale,
  withBase,
} from './i18n';

export type AlternateLink = { hreflang: Locale | 'x-default'; href: string };
export type NavLink = { label: string; href: string };
export type LanguageSwitch = { label: string; href: string; hreflang: Locale };

type UiStrings = {
  languageName: string;
  notFound: string;
  backToTop: string;
  backToGallery: string;
  prevPhoto: string;
  nextPhoto: string;
  siteNav: string;
  photoNav: string;
  careerSections: {
    experience: string;
    skills: string;
    certifications: string;
    achievements: string;
    patents: string;
  };
  achievementKind: Record<AchievementKind, string>;
  /** 特許の折りたたみの見出し。n は折りたたまれている件数 */
  morePatents: (n: number) => string;
  /** 在職中（to が無い）の終わりの表記（design D10） */
  present: string;
};

/** 画面に出す文字列。ナビの「Photos」「Career」は両言語とも英字なので navLinks に直接書く */
export const ui: Record<Locale, UiStrings> = {
  ja: {
    languageName: '日本語',
    notFound: 'ページが見つかりません',
    backToTop: '日本語のトップへ',
    backToGallery: '写真一覧へ',
    prevPhoto: '前の写真',
    nextPhoto: '次の写真',
    siteNav: 'サイト内の案内',
    photoNav: '前後の写真',
    careerSections: {
      experience: '職歴',
      skills: 'スキル',
      certifications: '資格',
      achievements: '実績',
      patents: '代表的な特許',
    },
    achievementKind: { talk: '登壇', article: '執筆', award: '受賞', other: 'その他' },
    morePatents: (n) => `さらに ${n} 件を表示`,
    present: '現在',
  },
  en: {
    languageName: 'English',
    notFound: 'Page not found',
    backToTop: 'Go to the English top',
    backToGallery: 'Back to photos',
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    siteNav: 'Site navigation',
    photoNav: 'Photo navigation',
    careerSections: {
      experience: 'Experience',
      skills: 'Skills',
      certifications: 'Certifications',
      achievements: 'Achievements',
      patents: 'Featured Patents',
    },
    achievementKind: { talk: 'Talk', article: 'Article', award: 'Award', other: 'Other' },
    morePatents: (n) => `Show ${n} more`,
    present: 'Present',
  },
};

/**
 * 絶対パスを site の絶対 URL にする。site にパスがあっても（例: `https://example.com/sub/`）
 * 捨てずに残す（design D6 系。canonical / hreflang / sitemap / og:image で共有する）
 */
export function absoluteUrl(path: string, site: string | URL): string {
  const siteUrl = new URL(site);
  const sitePath = siteUrl.pathname.endsWith('/') ? siteUrl.pathname : `${siteUrl.pathname}/`;
  return new URL(`.${path}`, `${siteUrl.origin}${sitePath}`).href;
}

/** hreflang の 3 本。x-default は既定ロケール（ja）と同じ */
export function alternateLinks(path: string, site: string | URL, base: string): AlternateLink[] {
  const href = (lang: Locale) => absoluteUrl(alternatePath(path, lang, base), site);
  return [
    ...locales.map((lang) => ({ hreflang: lang, href: href(lang) })),
    { hreflang: 'x-default', href: href(defaultLocale) },
  ];
}

/** そのロケールのトップ */
export function homePath(lang: Locale, base: string): string {
  return withBase(`/${lang}/`, base);
}

/** 写真のギャラリー（slug が null）または個別ページ */
export function photoPath(slug: string | null, lang: Locale, base: string): string {
  return withBase(slug === null ? `/${lang}/photos/` : `/${lang}/photos/${slug}/`, base);
}

/** ロケールごとの経歴ページ */
export function careerPath(lang: Locale, base: string): string {
  return withBase(`/${lang}/career/`, base);
}

/** そのページ自身の絶対 URL（design D6）。lang はパスから判定する */
export function canonicalUrl(path: string, site: string | URL, base: string): string {
  const lang = localeFromPath(path, base) ?? defaultLocale;
  return absoluteUrl(alternatePath(path, lang, base), site);
}

/** 共有カードの og:locale（design D3）。地域付きの表記に対応づける */
export function ogLocale(lang: Locale): string {
  return lang === 'ja' ? 'ja_JP' : 'en_US';
}

export function navLinks(lang: Locale, base: string): NavLink[] {
  return [
    { label: 'Photos', href: photoPath(null, lang, base) },
    { label: 'Career', href: careerPath(lang, base) },
  ];
}

/** 相手の言語名を表示し、同じページの他言語版へ飛ぶリンク */
export function languageSwitch(path: string, lang: Locale, base: string): LanguageSwitch {
  const target = otherLocale(lang);
  return {
    label: ui[target].languageName,
    href: alternatePath(path, target, base),
    hreflang: target,
  };
}
