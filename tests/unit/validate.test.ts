import { describe, expect, expectTypeOf, it } from 'vitest';
import { type Career, type Patent, PHOTO_BASE_URL, type Photo } from '../../src/content/schemas';
import type { Locale } from '../../src/lib/i18n';
import {
  assertValid,
  validateCareerParity,
  validateCareerPatents,
  validatePhotos,
} from '../../src/lib/validate';

function photo(id: string, over: Partial<Photo> = {}): { id: string; data: Photo } {
  return {
    id,
    data: {
      image: `${PHOTO_BASE_URL}${id}.jpg`,
      order: 10,
      featured: false,
      takenAt: new Date('2025-11-03'),
      title: { ja: 't', en: 't' },
      location: { ja: 'l', en: 'l' },
      alt: { ja: 'a', en: 'a' },
      exif: { camera: 'c', lens: 'l', aperture: 1.4, shutterSpeed: '1/250', iso: 800 },
      ...over,
    },
  };
}

describe('validatePhotos', () => {
  it('写真が 0 枚なら代表写真が無いことを報告する', () => {
    expect(validatePhotos([])).toEqual(['featured はちょうど 1 枚にする（現在 0 枚: なし）']);
  });

  it('featured が 1 枚、order が一意、URL が規約どおりなら問題なし', () => {
    const entries = [photo('a', { featured: true, order: 1 }), photo('b', { order: 2 })];
    expect(validatePhotos(entries)).toEqual([]);
  });

  it('featured が 0 枚なら報告する', () => {
    const errors = validatePhotos([photo('a', { order: 1 })]);
    expect(errors.some((e) => e.includes('featured'))).toBe(true);
  });

  it('featured が 2 枚なら報告する', () => {
    const errors = validatePhotos([
      photo('alpha', { featured: true, order: 1 }),
      photo('bravo', { featured: true, order: 2 }),
    ]);
    expect(errors.some((e) => e.includes('featured') && e.includes('alpha, bravo'))).toBe(true);
  });

  it('order が重複したら両方の slug を挙げて報告する', () => {
    const errors = validatePhotos([
      photo('a', { featured: true, order: 5 }),
      photo('b', { order: 5 }),
    ]);
    expect(errors.some((e) => e.includes('order') && e.includes('a') && e.includes('b'))).toBe(
      true,
    );
  });

  it('image が Release photos 配下の <slug>.jpg でなければ報告する', () => {
    const wrongHost = photo('a', { featured: true, order: 1, image: 'https://example.com/a.jpg' });
    const wrongName = photo('b', { order: 2, image: `${PHOTO_BASE_URL}other.jpg` });
    const errors = validatePhotos([wrongHost, wrongName]);
    expect(
      errors.some(
        (e) =>
          e.includes('a') &&
          e.includes(`${PHOTO_BASE_URL}a.jpg`) &&
          e.includes('https://example.com/a.jpg'),
      ),
    ).toBe(true);
    expect(
      errors.some(
        (e) =>
          e.includes('b') &&
          e.includes(`${PHOTO_BASE_URL}b.jpg`) &&
          e.includes(`${PHOTO_BASE_URL}other.jpg`),
      ),
    ).toBe(true);
  });

  it('title が TODO: のままなら slug と項目名を挙げて報告する', () => {
    const errors = validatePhotos([
      photo('kyoto', { featured: true, order: 1, title: { ja: 'TODO: 日本語タイトル', en: 'x' } }),
    ]);
    expect(errors.some((e) => e.includes('kyoto') && e.includes('title.ja'))).toBe(true);
  });

  it('location と alt も同じように見る', () => {
    const errors = validatePhotos([
      photo('kyoto', {
        featured: true,
        order: 1,
        location: { ja: 'x', en: 'TODO: Location' },
        alt: { ja: 'TODO: 代替テキスト', en: 'x' },
      }),
    ]);
    expect(errors.some((e) => e.includes('location.en'))).toBe(true);
    expect(errors.some((e) => e.includes('alt.ja'))).toBe(true);
  });

  it('TODO で始まっても印（TODO:）でなければ通す', () => {
    const errors = validatePhotos([
      photo('kyoto', { featured: true, order: 1, title: { ja: 'TODO リストの写真', en: 'x' } }),
    ]);
    expect(errors).toEqual([]);
  });
});

describe('validateCareerParity', () => {
  const base: Career = {
    experience: [{ from: '2020-04', organization: 'o', role: 'r', bullets: [] }],
    skills: { lang: ['ts'] },
    certifications: [{ date: '2023-06-01', name: 'c' }],
    achievements: [{ date: '2024-10-12', name: 'a', kind: 'talk' }],
    patents: [
      {
        filedAt: '2021-03',
        title: 't',
        number: 'JP1',
        countries: ['JP'],
        url: 'https://example.com/',
      },
    ],
  };

  it('件数が一致すれば問題なし', () => {
    expect(validateCareerParity(base, base)).toEqual([]);
  });

  it('experience / certifications / achievements の件数差を個別に報告する', () => {
    const en: Career = {
      ...base,
      certifications: [],
      achievements: [...base.achievements, base.achievements[0]],
    };
    const errors = validateCareerParity(base, en);
    expect(errors).toHaveLength(2);
    expect(
      errors.some((e) => e.includes('certifications') && e.includes('1') && e.includes('0')),
    ).toBe(true);
    expect(errors.some((e) => e.includes('achievements'))).toBe(true);
  });

  it('patents の件数差を報告する', () => {
    const en: Career = { ...base, patents: [] };
    const errors = validateCareerParity(base, en);
    expect(errors.some((e) => e.includes('patents') && e.includes('1') && e.includes('0'))).toBe(
      true,
    );
  });

  it('skills のカテゴリ数が日英で違えば報告する', () => {
    const en: Career = { ...base, skills: { lang: ['ts'], cloud: ['aws'] } };
    const errors = validateCareerParity(base, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe('skills のカテゴリ数が日英で違う（ja: 1, en: 2）');
  });

  it('対応するカテゴリの項目数が日英で違えば、何番目かを添えて報告する', () => {
    const ja: Career = { ...base, skills: { 言語: ['ts', 'py'], クラウド: ['aws'] } };
    const en: Career = { ...base, skills: { Languages: ['ts'], Cloud: ['aws'] } };
    const errors = validateCareerParity(ja, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(
      'skills の 1 番目のカテゴリの項目数が日英で違う（言語: 2, Languages: 1）',
    );
  });

  it('不一致が 2 番目のカテゴリにあれば、2 番目として報告する', () => {
    const ja: Career = { ...base, skills: { 言語: ['ts'], クラウド: ['aws', 'gcp'] } };
    const en: Career = { ...base, skills: { Languages: ['ts'], Cloud: ['aws'] } };
    const errors = validateCareerParity(ja, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(
      'skills の 2 番目のカテゴリの項目数が日英で違う（クラウド: 2, Cloud: 1）',
    );
  });

  it('カテゴリ名が訳語で違っても、数が合っていれば問題なし', () => {
    const ja: Career = { ...base, skills: { 言語: ['ts'] } };
    const en: Career = { ...base, skills: { Languages: ['ts'] } };
    expect(validateCareerParity(ja, en)).toEqual([]);
  });

  it('複数カテゴリで対応する項目数がすべて一致すれば問題なし', () => {
    const ja: Career = { ...base, skills: { 言語: ['ts', 'py'], クラウド: ['aws'] } };
    const en: Career = { ...base, skills: { Languages: ['ts', 'py'], Cloud: ['aws'] } };
    expect(validateCareerParity(ja, en)).toEqual([]);
  });

  it('カテゴリ数が違うときは、各カテゴリの項目数の比較まで進まない', () => {
    const en: Career = { ...base, skills: {} };
    const errors = validateCareerParity(base, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe('skills のカテゴリ数が日英で違う（ja: 1, en: 0）');
  });

  it('certifications の同じ位置の date が日英で違えば、何番目かと両方の値を報告する', () => {
    const ja: Career = {
      ...base,
      certifications: [
        { date: '2020-01', name: 'a' },
        { date: '2016-03', name: 'b' },
      ],
    };
    const en: Career = {
      ...base,
      certifications: [
        { date: '2020-01', name: 'a-en' },
        { date: '2018-06', name: 'b-en' },
      ],
    };
    const errors = validateCareerParity(ja, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(
      'certifications の 2 番目の date が日英で違う（ja: 2016-03, en: 2018-06）',
    );
  });

  it('achievements の同じ位置の date が日英で違えば、何番目かと両方の値を報告する', () => {
    const ja: Career = { ...base, achievements: [{ date: '2024-10-12', name: 'a', kind: 'talk' }] };
    const en: Career = {
      ...base,
      achievements: [{ date: '2025-01-01', name: 'a-en', kind: 'talk' }],
    };
    const errors = validateCareerParity(ja, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(
      'achievements の 1 番目の date が日英で違う（ja: 2024-10-12, en: 2025-01-01）',
    );
  });

  it('patents の同じ位置の filedAt が日英で違えば、何番目かと両方の値を報告する', () => {
    const ja: Career = {
      ...base,
      patents: [
        {
          filedAt: '2021-03',
          title: 't',
          number: 'JP1',
          countries: ['JP'],
          url: 'https://example.com/',
        },
      ],
    };
    const en: Career = {
      ...base,
      patents: [
        {
          filedAt: '2019-08',
          title: 't-en',
          number: 'JP1',
          countries: ['JP'],
          url: 'https://example.com/',
        },
      ],
    };
    const errors = validateCareerParity(ja, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(
      'patents の 1 番目が日英で違う（ja: countries 1 件 / filedAt 2021-03, en: countries 1 件 / filedAt 2019-08）',
    );
  });

  it('patents の同じ位置の countries の件数が日英で違えば報告する', () => {
    const ja: Career = {
      ...base,
      patents: [
        {
          filedAt: '2021-03',
          title: 't',
          number: 'JP1',
          countries: ['JP'],
          url: 'https://example.com/',
        },
      ],
    };
    const en: Career = {
      ...base,
      patents: [
        {
          filedAt: '2021-03',
          title: 't-en',
          number: 'JP1',
          countries: ['JP', 'US'],
          url: 'https://example.com/',
        },
      ],
    };
    const errors = validateCareerParity(ja, en);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(
      'patents の 1 番目が日英で違う（ja: countries 1 件 / filedAt 2021-03, en: countries 2 件 / filedAt 2021-03）',
    );
  });

  it('certifications / achievements / patents の比較キーがすべて一致すれば問題なし', () => {
    const ja: Career = {
      ...base,
      certifications: [{ date: '2020-01', name: 'a' }],
      achievements: [{ date: '2021-05', name: 'b', kind: 'talk' }],
      patents: [
        {
          filedAt: '2021-03',
          title: 't',
          number: 'JP1',
          countries: ['JP', 'US'],
          url: 'https://example.com/',
        },
      ],
    };
    const en: Career = {
      ...ja,
      certifications: [{ date: '2020-01', name: 'a-en' }],
      achievements: [{ date: '2021-05', name: 'b-en', kind: 'talk' }],
      patents: [
        {
          filedAt: '2021-03',
          title: 't-en',
          number: 'JP1',
          countries: ['JP', 'US'],
          url: 'https://example.com/',
        },
      ],
    };
    expect(validateCareerParity(ja, en)).toEqual([]);
  });
});

describe('validateCareerPatents', () => {
  function patent(over: Partial<Patent> = {}): Patent {
    return {
      filedAt: '2021-03',
      title: 't',
      number: 'JP6549500B2',
      countries: ['JP', 'CN', 'US'],
      url: 'https://example.com/',
      ...over,
    };
  }

  function career(patents: Patent[]): Career {
    return {
      experience: [],
      skills: {},
      certifications: [],
      achievements: [],
      patents,
    };
  }

  it('countries の先頭が代表公報の国と一致すれば問題なし', () => {
    const errors = validateCareerPatents(career([patent()]), 'ja');
    expect(errors).toEqual([]);
  });

  it('countries の先頭が代表公報の国と違えば number と countries[0] を含めて報告する', () => {
    const errors = validateCareerPatents(career([patent({ countries: ['CN', 'JP'] })]), 'ja');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('JP6549500B2');
    expect(errors[0]).toContain('CN');
  });

  it('日本語のデータは整合し英語のデータだけ先頭が違うとき、英語側だけ 1 件のエラーになる', () => {
    const ja = career([patent()]);
    const en = career([patent({ countries: ['CN', 'JP'] })]);
    expect(validateCareerPatents(ja, 'ja')).toEqual([]);
    const enErrors = validateCareerPatents(en, 'en');
    expect(enErrors).toHaveLength(1);
    expect(enErrors[0]).toContain('JP6549500B2');
    expect(enErrors[0]).toContain('CN');
  });

  it('日本語の見出しが 40 文字なら問題なし', () => {
    const errors = validateCareerPatents(career([patent({ title: 'あ'.repeat(40) })]), 'ja');
    expect(errors).toEqual([]);
  });

  it('日本語の見出しが 41 文字なら number と文字数を含めて報告する', () => {
    const errors = validateCareerPatents(career([patent({ title: 'あ'.repeat(41) })]), 'ja');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('JP6549500B2');
    expect(errors[0]).toContain('41');
  });

  it('英語の見出しが 90 文字なら問題なし', () => {
    const errors = validateCareerPatents(career([patent({ title: 'a'.repeat(90) })]), 'en');
    expect(errors).toEqual([]);
  });

  it('英語の見出しが 91 文字なら number と文字数を含めて報告する', () => {
    const errors = validateCareerPatents(career([patent({ title: 'a'.repeat(91) })]), 'en');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('JP6549500B2');
    expect(errors[0]).toContain('91');
  });

  it('サロゲートペアを含む見出しはコードポイント数で数える（UTF-16 単位ではない）', () => {
    const title = '😀'.repeat(40); // コードポイント 40、UTF-16 単位では 80
    const errors = validateCareerPatents(career([patent({ title })]), 'ja');
    expect(errors).toEqual([]);
  });

  it('lang は Locale だけを受ける（"JA" のような文字列で英語の上限が黙って使われない）', () => {
    expectTypeOf(validateCareerPatents).parameter(1).toEqualTypeOf<Locale>();
  });

  it('同じ言語で number が重複したら、重複した number を含めて 1 件報告する', () => {
    const errors = validateCareerPatents(
      career([patent(), patent({ filedAt: '2019-01', title: 'u' })]),
      'ja',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('JP6549500B2');
    expect(errors[0]).toContain('重複');
  });

  it('英語のデータでも number の重複を報告する', () => {
    const errors = validateCareerPatents(career([patent(), patent()]), 'en');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('JP6549500B2');
  });

  it('number が違えば重複として報告しない', () => {
    const errors = validateCareerPatents(
      career([patent(), patent({ number: 'JP7200645B2' })]),
      'ja',
    );
    expect(errors).toEqual([]);
  });
});

describe('assertValid', () => {
  it('空なら何もしない', () => {
    expect(() => assertValid([], 'photos')).not.toThrow();
  });

  it('1 件以上なら subject と全メッセージを含む Error を投げる', () => {
    expect(() => assertValid(['x is bad', 'y is bad'], 'photos')).toThrow(
      /photos[\s\S]*x is bad[\s\S]*y is bad/,
    );
  });
});
