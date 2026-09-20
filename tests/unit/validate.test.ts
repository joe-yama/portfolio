import { describe, expect, it } from 'vitest';
import { type Career, PHOTO_BASE_URL, type Photo } from '../../src/content/schemas';
import { assertValid, validateCareerParity, validatePhotos } from '../../src/lib/validate';

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
  it('写真が 0 枚なら制約を評価せず問題なしとする', () => {
    expect(validatePhotos([])).toEqual([]);
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
