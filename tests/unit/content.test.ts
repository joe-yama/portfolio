import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Career, Patent } from '../../src/content/schemas';

// getCareer がビルドの経路（getEntry → 検証）から検証を外したら落ちる番人（design D3）。
// astro:content を差し替え、日英のデータをテストごとに入れ替える
const entries = vi.hoisted(() => ({}) as Record<'ja' | 'en', Career>);
// getPhotos の配線の番人（design D3）。写真の一覧もテストから差し替える
const photoEntries = vi.hoisted(() => ({ list: [] as { id: string; data: unknown }[] }));

vi.mock('astro:content', () => ({
  getEntry: vi.fn(async (_collection: string, id: 'ja' | 'en') => ({ id, data: entries[id] })),
  getCollection: vi.fn(async () => photoEntries.list),
}));

import { getCareer, getFeaturedPhoto, getPhotos } from '../../src/lib/content';

function patent(number: string): Patent {
  return {
    filedAt: '2021-03',
    title: 't',
    number,
    countries: ['JP'],
    url: `https://patents.google.com/patent/${number}/ja`,
  };
}

function career(patents: Patent[]): Career {
  return { experience: [], skills: {}, certifications: [], achievements: [], patents };
}

describe('getCareer の検証の配線', () => {
  beforeEach(() => {
    entries.ja = career([patent('JP6549500B2'), patent('JP7200645B2')]);
    entries.en = career([patent('JP6549500B2'), patent('JP7200645B2')]);
  });

  it('整合したデータなら要求した言語のデータを返す', async () => {
    await expect(getCareer('en')).resolves.toBe(entries.en);
  });

  it('日本語のデータで公報番号が重複していれば例外を投げる', async () => {
    entries.ja = career([patent('JP6549500B2'), patent('JP6549500B2')]);
    await expect(getCareer('en')).rejects.toThrow(
      /career の内容に問題がある[\s\S]*ja: number が重複している（number: JP6549500B2）/,
    );
  });

  it('英語のデータで公報番号が重複していれば例外を投げる', async () => {
    entries.en = career([patent('JP6549500B2'), patent('JP6549500B2')]);
    await expect(getCareer('ja')).rejects.toThrow(
      /career の内容に問題がある[\s\S]*en: number が重複している（number: JP6549500B2）/,
    );
  });

  it('日英の件数が違えば例外を投げる（validateCareerParity の配線）', async () => {
    entries.en = career([patent('JP6549500B2')]);
    await expect(getCareer('ja')).rejects.toThrow(/career の内容に問題がある[\s\S]*patents/);
  });

  it('ja と en の両方にエラーがあれば、1 つの例外に両方が出る', async () => {
    entries.ja = career([patent('JP6549500B2'), patent('JP6549500B2')]);
    entries.en = career([patent('JP7200645B2'), patent('JP7200645B2')]);
    const error = await getCareer('ja').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    const { message } = error as Error;
    expect(message).toMatch(/^career の内容に問題がある/);
    expect(message).toContain('ja: number が重複している（number: JP6549500B2）');
    expect(message).toContain('en: number が重複している（number: JP7200645B2）');
  });

  it('整合したデータなら日本語のデータも返す', async () => {
    await expect(getCareer('ja')).resolves.toBe(entries.ja);
  });

  // 41〜90 文字の title は ja の上限（40）を超え、en の上限（90）には収まる。
  // 検証に渡すロケールを入れ替えると、この 2 件の結果が逆になる
  it('日本語のデータは日本語の上限で検証する', async () => {
    entries.ja = career([
      { ...patent('JP6549500B2'), title: 'あ'.repeat(41) },
      patent('JP7200645B2'),
    ]);
    await expect(getCareer('ja')).rejects.toThrow(/ja: title が長すぎる/);
  });

  it('英語のデータは英語の上限で検証する', async () => {
    entries.en = career([
      { ...patent('JP6549500B2'), title: 'a'.repeat(41) },
      patent('JP7200645B2'),
    ]);
    await expect(getCareer('en')).resolves.toBe(entries.en);
  });
});

describe('getPhotos の検証の配線', () => {
  beforeEach(() => {
    photoEntries.list = [];
  });

  it('写真が 0 枚ならビルドを止め、代表写真が無いことを示す', async () => {
    await expect(getPhotos()).rejects.toThrow(
      /photos の内容に問題がある[\s\S]*featured[\s\S]*0 枚/,
    );
  });

  // getFeaturedPhoto が getPhotos（検証）を通らず getCollection を直接読むと、
  // 別の文言で落ちるか undefined を返す
  it('getFeaturedPhoto も写真が 0 枚なら同じ検証で止まる', async () => {
    await expect(getFeaturedPhoto()).rejects.toThrow(
      /photos の内容に問題がある[\s\S]*featured[\s\S]*0 枚/,
    );
  });
});
