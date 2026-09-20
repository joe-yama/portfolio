import { describe, expect, it } from 'vitest';
import type { Exif } from '../../src/content/schemas';
import { formatExif, formatTakenAt } from '../../src/lib/photo';

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
    // 2025-11-03T00:00:00Z。ローカル時刻で解釈すると西半球では 11/2 になる
    expect(formatTakenAt(new Date('2025-11-03T00:00:00Z'), 'ja')).toBe('2025年11月3日');
    // 2025-11-03T23:00:00Z。ローカル時刻で解釈すると東半球では 11/4 になる
    expect(formatTakenAt(new Date('2025-11-03T23:00:00Z'), 'ja')).toBe('2025年11月3日');
  });
});
