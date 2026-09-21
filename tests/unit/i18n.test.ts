import { describe, expect, it } from 'vitest';
import {
  alternatePath,
  defaultLocale,
  localeFromPath,
  locales,
  otherLocale,
  stripBase,
  toLocale,
  withBase,
} from '../../src/lib/i18n';

describe('locales', () => {
  it('ja が既定で、ja と en の 2 つ', () => {
    expect(locales).toEqual(['ja', 'en']);
    expect(defaultLocale).toBe('ja');
  });

  it('otherLocale は相手の言語を返す', () => {
    expect(otherLocale('ja')).toBe('en');
    expect(otherLocale('en')).toBe('ja');
  });
});

describe('localeFromPath', () => {
  it('先頭セグメントがロケールならそれを返す', () => {
    expect(localeFromPath('/ja/', '/')).toBe('ja');
    expect(localeFromPath('/en/photos/kyoto/', '/')).toBe('en');
  });

  it('ロケールで始まらないパスは null', () => {
    expect(localeFromPath('/', '/')).toBeNull();
    expect(localeFromPath('/photos/', '/')).toBeNull();
    expect(localeFromPath('/japan/', '/')).toBeNull();
  });
});

describe('localeFromPath（base 付き）', () => {
  it('base 付きのパスからロケールを判定する', () => {
    expect(localeFromPath('/portfolio/en/career/', '/portfolio/')).toBe('en');
  });

  it('base そのものはロケールなし', () => {
    expect(localeFromPath('/portfolio/', '/portfolio/')).toBeNull();
  });
});

describe('alternatePath', () => {
  it('同じページの他言語版に差し替える', () => {
    expect(alternatePath('/ja/photos/kyoto/', 'en', '/')).toBe('/en/photos/kyoto/');
    expect(alternatePath('/en/career/', 'ja', '/')).toBe('/ja/career/');
    expect(alternatePath('/ja/', 'en', '/')).toBe('/en/');
  });

  it('接頭辞が無いパスにはロケールを前置する', () => {
    expect(alternatePath('/', 'ja', '/')).toBe('/ja/');
    expect(alternatePath('/404/', 'en', '/')).toBe('/en/404/');
  });
});

describe('alternatePath（base 付き）', () => {
  it('言語接頭辞だけを置き換え、base を保つ', () => {
    expect(alternatePath('/portfolio/ja/photos/x/', 'en', '/portfolio/')).toBe(
      '/portfolio/en/photos/x/',
    );
  });

  it('base 付きのトップ', () => {
    expect(alternatePath('/portfolio/en/', 'ja', '/portfolio/')).toBe('/portfolio/ja/');
  });
});

describe('toLocale', () => {
  it('ロケールの文字列はそのまま返す', () => {
    expect(toLocale('ja')).toBe('ja');
    expect(toLocale('en')).toBe('en');
  });

  it('ロケールでない値は例外にする', () => {
    expect(() => toLocale('fr')).toThrow('fr');
    expect(() => toLocale(undefined)).toThrow('undefined');
    expect(() => toLocale('')).toThrow('""');
  });
});

describe('stripBase', () => {
  it('先頭の base を取り除く', () => {
    expect(stripBase('/portfolio/en/career/', '/portfolio/')).toBe('/en/career/');
  });

  it('base が付いていなければそのまま返す', () => {
    expect(stripBase('/en/career/', '/portfolio/')).toBe('/en/career/');
  });

  it('base そのものは / になる', () => {
    expect(stripBase('/portfolio/', '/portfolio/')).toBe('/');
  });

  it('base が / なら何もしない', () => {
    expect(stripBase('/ja/', '/')).toBe('/ja/');
  });

  it('似た接頭辞を誤って剥がさない', () => {
    expect(stripBase('/portfolios/ja/', '/portfolio/')).toBe('/portfolios/ja/');
  });

  it('接頭辞が先頭に無ければ、途中に含むだけでは剥がさない', () => {
    expect(stripBase('/x/portfolio/ja/', '/portfolio/')).toBe('/x/portfolio/ja/');
  });
});

describe('normalizeBase（stripBase 経由で観測する両端トリム）', () => {
  it('前後のスラッシュの有無によらず同じ base として扱う', () => {
    for (const base of ['portfolio', '/portfolio', 'portfolio/']) {
      expect(withBase('/en/', base)).toBe('/portfolio/en/');
    }
  });
});

describe('withBase', () => {
  it('base を前置する', () => {
    expect(withBase('/en/career/', '/portfolio/')).toBe('/portfolio/en/career/');
  });

  it('二重に付けない', () => {
    expect(withBase('/portfolio/en/career/', '/portfolio/')).toBe('/portfolio/en/career/');
  });

  it('base が / なら何もしない', () => {
    expect(withBase('/ja/', '/')).toBe('/ja/');
  });

  it('ルートに base を付ける', () => {
    expect(withBase('/', '/portfolio/')).toBe('/portfolio/');
  });
});
