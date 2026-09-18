import { describe, expect, it } from 'vitest';
import {
  alternatePath,
  defaultLocale,
  localeFromPath,
  locales,
  otherLocale,
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
    expect(localeFromPath('/ja/')).toBe('ja');
    expect(localeFromPath('/en/photos/kyoto/')).toBe('en');
  });

  it('ロケールで始まらないパスは null', () => {
    expect(localeFromPath('/')).toBeNull();
    expect(localeFromPath('/photos/')).toBeNull();
    expect(localeFromPath('/japan/')).toBeNull();
  });
});

describe('alternatePath', () => {
  it('同じページの他言語版に差し替える', () => {
    expect(alternatePath('/ja/photos/kyoto/', 'en')).toBe('/en/photos/kyoto/');
    expect(alternatePath('/en/career/', 'ja')).toBe('/ja/career/');
    expect(alternatePath('/ja/', 'en')).toBe('/en/');
  });

  it('接頭辞が無いパスにはロケールを前置する', () => {
    expect(alternatePath('/', 'ja')).toBe('/ja/');
    expect(alternatePath('/404/', 'en')).toBe('/en/404/');
  });
});
