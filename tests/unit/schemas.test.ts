import { describe, expect, it } from 'vitest';
import {
  careerSchema,
  PHOTO_BASE_URL,
  patentSchema,
  photoSchema,
  profileSchema,
} from '../../src/content/schemas';

const validPhoto = {
  image: `${PHOTO_BASE_URL}2025-kyoto-dawn.jpg`,
  order: 10,
  featured: true,
  takenAt: '2025-11-03',
  title: { ja: '夜明けの鴨川', en: 'Kamo River at Dawn' },
  location: { ja: '京都', en: 'Kyoto, Japan' },
  alt: { ja: '夜明けの鴨川と橋', en: 'Kamo River and a bridge at dawn' },
  exif: {
    camera: 'Fujifilm X-T5',
    lens: 'XF 23mm F1.4 R LM WR',
    aperture: 1.4,
    shutterSpeed: '1/250',
    iso: 800,
  },
};

describe('photoSchema', () => {
  it('正しい写真データを受け付け、takenAt を Date にする', () => {
    const parsed = photoSchema.parse(validPhoto);
    expect(parsed.takenAt).toBeInstanceOf(Date);
    expect(parsed.takenAt.toISOString().slice(0, 10)).toBe('2025-11-03');
  });

  it('featured を省略すると false', () => {
    const { featured: _omit, ...rest } = validPhoto;
    expect(photoSchema.parse(rest).featured).toBe(false);
  });

  it('takenAt は Date か YYYY-MM-DD 文字列のみ受け付ける（null / 数値 / 真偽値は拒否）', () => {
    expect(photoSchema.safeParse({ ...validPhoto, takenAt: null }).success).toBe(false);
    expect(photoSchema.safeParse({ ...validPhoto, takenAt: 0 }).success).toBe(false);
    expect(photoSchema.safeParse({ ...validPhoto, takenAt: true }).success).toBe(false);

    const parsedFromDate = photoSchema.parse({ ...validPhoto, takenAt: new Date('2025-11-03') });
    expect(parsedFromDate.takenAt).toBeInstanceOf(Date);

    const parsedFromString = photoSchema.parse({ ...validPhoto, takenAt: '2025-11-03' });
    expect(parsedFromString.takenAt).toBeInstanceOf(Date);
  });

  it('image が URL でなければ拒否する', () => {
    expect(photoSchema.safeParse({ ...validPhoto, image: '../../assets/x.jpg' }).success).toBe(
      false,
    );
  });

  it('exif の 5 項目はすべて必須', () => {
    for (const key of ['camera', 'lens', 'aperture', 'shutterSpeed', 'iso'] as const) {
      const exif: Record<string, unknown> = { ...validPhoto.exif };
      delete exif[key];
      expect(photoSchema.safeParse({ ...validPhoto, exif }).success).toBe(false);
    }
  });

  it('aperture は正の数、iso は正の整数', () => {
    expect(
      photoSchema.safeParse({ ...validPhoto, exif: { ...validPhoto.exif, aperture: 0 } }).success,
    ).toBe(false);
    expect(
      photoSchema.safeParse({ ...validPhoto, exif: { ...validPhoto.exif, iso: 800.5 } }).success,
    ).toBe(false);
  });

  it('alt は両言語とも空文字を許さない', () => {
    expect(photoSchema.safeParse({ ...validPhoto, alt: { ja: '', en: 'x' } }).success).toBe(false);
  });

  it('alt は en キーが無いと拒否する', () => {
    const altJaOnly: Record<string, unknown> = { ...validPhoto.alt };
    delete altJaOnly.en;
    expect(photoSchema.safeParse({ ...validPhoto, alt: altJaOnly }).success).toBe(false);
  });

  it('order は整数のみ許す（小数は拒否）', () => {
    expect(photoSchema.safeParse({ ...validPhoto, order: 1.5 }).success).toBe(false);
  });
});

const validCareer = {
  experience: [
    {
      from: '2020-04',
      organization: 'サンプル株式会社',
      role: 'ソフトウェアエンジニア',
      bullets: ['a', 'b'],
    },
  ],
  skills: { 言語: ['TypeScript', 'Python'], クラウド: ['AWS'] },
  certifications: [{ date: '2023-06-01', name: '応用情報技術者' }],
  achievements: [
    { date: '2024-10-12', name: '社外勉強会で登壇', kind: 'talk', url: 'https://example.com/talk' },
  ],
  patents: [
    {
      filedAt: '2021-03',
      title: '発明の名称',
      number: 'JP2021-123456A',
      countries: ['JP'],
    },
  ],
};

describe('careerSchema', () => {
  it('正しい経歴データを受け付ける', () => {
    expect(careerSchema.safeParse(validCareer).success).toBe(true);
  });

  it('patents を持たないと失敗する', () => {
    const { patents: _omit, ...rest } = validCareer;
    expect(careerSchema.safeParse(rest).success).toBe(false);
  });

  it('experience の bullets は最大 5', () => {
    const six = { ...validCareer.experience[0], bullets: ['1', '2', '3', '4', '5', '6'] };
    expect(careerSchema.safeParse({ ...validCareer, experience: [six] }).success).toBe(false);
  });

  it('experience の bullets はちょうど 5 件なら成功する', () => {
    const five = { ...validCareer.experience[0], bullets: ['1', '2', '3', '4', '5'] };
    expect(careerSchema.safeParse({ ...validCareer, experience: [five] }).success).toBe(true);
  });

  it('from / to は YYYY-MM 形式', () => {
    const bad = { ...validCareer.experience[0], from: '2020/04' };
    expect(careerSchema.safeParse({ ...validCareer, experience: [bad] }).success).toBe(false);
    const withTo = { ...validCareer.experience[0], to: '2024-03' };
    expect(careerSchema.safeParse({ ...validCareer, experience: [withTo] }).success).toBe(true);
  });

  it('to は null（在職中）も受け付ける', () => {
    const withNullTo = { ...validCareer.experience[0], to: null };
    expect(careerSchema.safeParse({ ...validCareer, experience: [withNullTo] }).success).toBe(true);
  });

  it('achievements の kind は talk / article / award / other のみ', () => {
    const bad = { ...validCareer.achievements[0], kind: 'blog' };
    expect(careerSchema.safeParse({ ...validCareer, achievements: [bad] }).success).toBe(false);
  });
});

describe('profileSchema', () => {
  const validProfile = {
    name: 'joe-yama',
    tagline: '写真を撮るソフトウェアエンジニア',
    links: [
      { label: 'GitHub', url: 'https://github.com/joe-yama', kind: 'github' },
      { label: 'Email', url: 'mailto:hello@example.com', kind: 'email' },
    ],
  };

  it('正しいプロフィールを受け付ける（mailto も URL として許す）', () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  // spec は links[] の件数を制約しない（Ruling 12）。brief 由来の「1 件以上」は外し、
  // links: [] は成功、kind は列挙のみという期待値にする。
  it('links は空配列も許すが、kind は列挙のみ', () => {
    expect(profileSchema.safeParse({ ...validProfile, links: [] }).success).toBe(true);
    const bad = { ...validProfile.links[0], kind: 'mastodon' };
    expect(profileSchema.safeParse({ ...validProfile, links: [bad] }).success).toBe(false);
  });

  it('tagline を欠くと失敗する', () => {
    const { tagline: _omit, ...rest } = validProfile;
    expect(profileSchema.safeParse(rest).success).toBe(false);
  });
});

const validPatent = {
  filedAt: '2021-03',
  title: '発明の名称',
  number: 'JP2021-123456A',
  countries: ['JP', 'CN'],
};

describe('patentSchema', () => {
  it('必須項目が揃えば成功する', () => {
    expect(patentSchema.safeParse(validPatent).success).toBe(true);
  });

  it('filedAt が YYYY-MM でなければ失敗する（月なし・日まで）', () => {
    expect(patentSchema.safeParse({ ...validPatent, filedAt: '2021-3' }).success).toBe(false);
    expect(patentSchema.safeParse({ ...validPatent, filedAt: '2021-03-15' }).success).toBe(false);
  });

  it('countries が空配列なら失敗する', () => {
    expect(patentSchema.safeParse({ ...validPatent, countries: [] }).success).toBe(false);
  });

  it('number が無ければ失敗する', () => {
    const { number: _omit, ...rest } = validPatent;
    expect(patentSchema.safeParse(rest).success).toBe(false);
  });

  it('title が無ければ失敗する', () => {
    const { title: _omit, ...rest } = validPatent;
    expect(patentSchema.safeParse(rest).success).toBe(false);
  });

  it('url は任意', () => {
    expect(patentSchema.safeParse(validPatent).success).toBe(true);
    expect(
      patentSchema.safeParse({ ...validPatent, url: 'https://patents.google.com/patent/x' })
        .success,
    ).toBe(true);
  });
});
