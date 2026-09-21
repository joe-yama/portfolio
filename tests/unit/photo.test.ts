import { describe, expect, it, vi } from 'vitest';
import { type Exif, PHOTO_BASE_URL, type PhotoEntry } from '../../src/content/schemas';
import { formatExif, formatTakenAt, neighbors } from '../../src/lib/photo';

const exif: Exif = {
  camera: 'Fujifilm X-T5',
  lens: 'XF 23mm F1.4 R LM WR',
  aperture: 1.4,
  shutterSpeed: '1/250',
  iso: 800,
};

describe('formatExif', () => {
  it('設計書の形式で 1 行にまとめる', () => {
    expect(formatExif(exif)).toBe('Fujifilm X-T5 · XF 23mm F1.4 R LM WR · f/1.4 · 1/250 · ISO 800');
  });

  it('絞りが整数のときは小数点を付けない', () => {
    expect(formatExif({ ...exif, aperture: 2 })).toContain('f/2');
  });
});

describe('formatTakenAt', () => {
  it('日本語は年月日', () => {
    expect(formatTakenAt(new Date('2025-11-03'), 'ja')).toBe('2025年11月3日');
  });

  it('英語は月名', () => {
    expect(formatTakenAt(new Date('2025-11-03'), 'en')).toBe('November 3, 2025');
  });

  it('日付の境目でも UTC で解釈するのでずれない', () => {
    vi.stubEnv('TZ', 'America/New_York'); // 西半球。ローカル解釈だと 11/2 になる
    expect(formatTakenAt(new Date('2025-11-03T00:00:00Z'), 'ja')).toBe('2025年11月3日');
    vi.stubEnv('TZ', 'Asia/Tokyo'); // 東半球。ローカル解釈だと 11/4 になる
    expect(formatTakenAt(new Date('2025-11-03T23:00:00Z'), 'ja')).toBe('2025年11月3日');
    vi.unstubAllEnvs();
  });
});

function entry(id: string, order: number): PhotoEntry {
  return {
    id,
    data: {
      image: `${PHOTO_BASE_URL}${id}.jpg`,
      order,
      featured: false,
      takenAt: new Date('2025-11-03'),
      title: { ja: 't', en: 't' },
      location: { ja: 'l', en: 'l' },
      alt: { ja: 'a', en: 'a' },
      exif,
    },
  };
}

describe('neighbors', () => {
  const photos = [entry('a', 10), entry('b', 20), entry('c', 30)];

  it('中間の写真は前後とも返す', () => {
    const { prev, next } = neighbors(photos, 'b');
    expect(prev?.id).toBe('a');
    expect(next?.id).toBe('c');
  });

  it('先頭の写真に前は無い', () => {
    const { prev, next } = neighbors(photos, 'a');
    expect(prev).toBeUndefined();
    expect(next?.id).toBe('b');
  });

  it('末尾の写真に次は無い', () => {
    const { prev, next } = neighbors(photos, 'c');
    expect(prev?.id).toBe('b');
    expect(next).toBeUndefined();
  });

  it('1 枚しか無いときは前も次も無い', () => {
    const { prev, next } = neighbors([entry('only', 10)], 'only');
    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });

  it('知らない slug は例外にする', () => {
    expect(() => neighbors(photos, 'zzz')).toThrow('zzz');
  });
});
