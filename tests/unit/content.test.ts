import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Career } from '../../src/content/schemas';

// getCareer がビルドの経路（getEntry → 検証）から検証を外したら落ちる番人（design D3）。
// astro:content を差し替え、日英のデータをテストごとに入れ替える
const entries = vi.hoisted(() => ({}) as Partial<Record<'ja' | 'en', Career>>);
// getPhotos の配線の番人（design D3）。写真の一覧もテストから差し替える
const photoEntries = vi.hoisted(() => ({ list: [] as { id: string; data: unknown }[] }));

vi.mock('astro:content', () => ({
  getEntry: vi.fn(async (_collection: string, id: 'ja' | 'en') => {
    const data = entries[id];
    return data === undefined ? undefined : { id, data };
  }),
  getCollection: vi.fn(async () => photoEntries.list),
}));

import { getCareer, getPhotos } from '../../src/lib/content';

type Patent = Career['patents'][number];

function patent(number: string): Patent {
  return {
    filedAt: '2021-03',
    title: 't',
    number,
    countries: ['JP'],
    url: 'https://example.com/',
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
    await expect(getCareer('en')).rejects.toThrow(/career\/ja[\s\S]*JP6549500B2/);
  });

  it('英語のデータで公報番号が重複していれば例外を投げる', async () => {
    entries.en = career([patent('JP6549500B2'), patent('JP6549500B2')]);
    await expect(getCareer('ja')).rejects.toThrow(/career\/en[\s\S]*JP6549500B2/);
  });

  it('日英の件数が違えば例外を投げる（validateCareerParity の配線）', async () => {
    entries.en = career([patent('JP6549500B2')]);
    await expect(getCareer('ja')).rejects.toThrow(/career の内容に問題がある[\s\S]*patents/);
  });
});

describe('getPhotos の検証の配線', () => {
  it('写真が 0 枚ならビルドを止め、代表写真が無いことを示す', async () => {
    photoEntries.list = [];
    await expect(getPhotos()).rejects.toThrow(
      /photos の内容に問題がある[\s\S]*featured[\s\S]*0 枚/,
    );
  });
});
