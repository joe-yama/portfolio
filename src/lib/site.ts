import { alternatePath, defaultLocale, type Locale, locales, otherLocale, withBase } from './i18n';

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
  careerSections: {
    experience: string;
    skills: string;
    certifications: string;
    achievements: string;
  };
  achievementKind: Record<'talk' | 'article' | 'award' | 'other', string>;
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
    careerSections: {
      experience: '職歴',
      skills: 'スキル',
      certifications: '資格',
      achievements: '実績',
    },
    achievementKind: { talk: '登壇', article: '執筆', award: '受賞', other: 'その他' },
  },
  en: {
    languageName: 'English',
    notFound: 'Page not found',
    backToTop: 'Go to the English top',
    backToGallery: 'Back to photos',
    prevPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    careerSections: {
      experience: 'Experience',
      skills: 'Skills',
      certifications: 'Certifications',
      achievements: 'Achievements',
    },
    achievementKind: { talk: 'Talk', article: 'Article', award: 'Award', other: 'Other' },
  },
};

/** hreflang の 3 本。x-default は既定ロケール（ja）と同じ */
export function alternateLinks(path: string, site: string | URL, base: string): AlternateLink[] {
  const href = (lang: Locale) => new URL(alternatePath(path, lang, base), site).href;
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

/** favicon などの静的アセット */
export function assetPath(path: string, base: string): string {
  return withBase(path, base);
}

export function navLinks(lang: Locale, base: string): NavLink[] {
  return [
    { label: 'Photos', href: photoPath(null, lang, base) },
    { label: 'Career', href: withBase(`/${lang}/career/`, base) },
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
