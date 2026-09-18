import { describe, expect, it } from 'vitest';
import {
  careerSchema,
  PHOTO_BASE_URL,
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
};

describe('careerSchema', () => {
  it('正しい経歴データを受け付ける', () => {
    expect(careerSchema.safeParse(validCareer).success).toBe(true);
  });

  it('experience の bullets は最大 5', () => {
    const six = { ...validCareer.experience[0], bullets: ['1', '2', '3', '4', '5', '6'] };
    expect(careerSchema.safeParse({ ...validCareer, experience: [six] }).success).toBe(false);
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

  it('links は 1 件以上、kind は列挙のみ', () => {
    expect(profileSchema.safeParse({ ...validProfile, links: [] }).success).toBe(false);
    const bad = { ...validProfile.links[0], kind: 'mastodon' };
    expect(profileSchema.safeParse({ ...validProfile, links: [bad] }).success).toBe(false);
  });
});
