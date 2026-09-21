import { describe, expect, it } from 'vitest';
import {
  exifToPhotoMeta,
  formatShutterSpeed,
  formatTakenAtYmd,
  nextOrder,
  type PhotoMeta,
  type RawExif,
  renderPhotoYaml,
  toSlug,
} from '../../src/lib/photo-meta';

describe('toSlug', () => {
  it('拡張子を落として小文字の kebab-case にする', () => {
    expect(toSlug('DSCF1234.JPG')).toBe('dscf1234');
    expect(toSlug('2025 Kyoto Dawn.jpeg')).toBe('2025-kyoto-dawn');
    expect(toSlug('kamo_river--dawn.jpg')).toBe('kamo-river-dawn');
  });

  it('英数字が残らないファイル名は例外にする（--slug を使わせる）', () => {
    expect(() => toSlug('鴨川.jpg')).toThrow('--slug');
  });

  it('--slug が指定されていれば拡張子に見える部分を切り詰めずそのまま使う', () => {
    expect(toSlug('x.jpg', 'kamo-river-v1.2')).toBe('kamo-river-v1.2');
  });

  it('--slug の値に英数字が無ければ例外にする（ファイル名由来とは異なる文言で、--slug の案内はしない）', () => {
    let message = '';
    try {
      toSlug('x.jpg', '鴨川');
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain('鴨川');
    expect(message).not.toContain('--slug');
  });
});

describe('formatShutterSpeed', () => {
  it('1 秒未満は分数にする', () => {
    expect(formatShutterSpeed(0.004)).toBe('1/250');
    expect(formatShutterSpeed(1 / 60)).toBe('1/60');
  });

  it('1 秒以上は秒で書き、余分な 0 を付けない', () => {
    expect(formatShutterSpeed(2)).toBe('2s');
    expect(formatShutterSpeed(1.6)).toBe('1.6s');
    expect(formatShutterSpeed(1)).toBe('1s');
  });

  it('0 以下は例外にする', () => {
    expect(() => formatShutterSpeed(0)).toThrow();
  });

  it('境界は 0.5 秒に置き、それより遅い露出は秒で書く（1/1 のような表示を避ける）', () => {
    expect(formatShutterSpeed(0.5)).toBe('1/2');
    expect(formatShutterSpeed(0.625)).toBe('0.6s');
    expect(formatShutterSpeed(0.7692)).toBe('0.8s');
    expect(formatShutterSpeed(0.9)).toBe('0.9s');
    expect(formatShutterSpeed(1 / 3)).toBe('1/3');
  });
});

describe('formatTakenAtYmd', () => {
  it('EXIF の撮影日時をローカル時刻のまま YYYY-MM-DD にする', () => {
    // EXIF の DateTimeOriginal はタイムゾーンを持たず、exifr はローカル時刻の Date を返す。
    // UTC に直すと撮影日がずれるので、ローカルの年月日をそのまま使う
    expect(formatTakenAtYmd(new Date(2025, 10, 3, 5, 30))).toBe('2025-11-03');
    expect(formatTakenAtYmd(new Date(2025, 0, 9, 23, 59))).toBe('2025-01-09');
  });
});

describe('nextOrder', () => {
  it('空なら 10', () => {
    expect(nextOrder([])).toBe(10);
  });

  it('既存の最大値より後ろにする', () => {
    expect(nextOrder([10, 30, 20])).toBe(40);
  });
});

const raw: RawExif = {
  DateTimeOriginal: new Date(2025, 10, 3, 5, 30),
  Make: 'FUJIFILM',
  Model: 'X-T5',
  LensModel: 'XF23mmF1.4 R LM WR',
  FNumber: 1.4,
  ExposureTime: 0.004,
  ISO: 800,
};

describe('exifToPhotoMeta', () => {
  it('必要な項目がそろっていれば変換する', () => {
    const result = exifToPhotoMeta(raw, 'kamo-river-dawn');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.meta).toEqual({
      slug: 'kamo-river-dawn',
      takenAt: '2025-11-03',
      camera: 'FUJIFILM X-T5',
      lens: 'XF23mmF1.4 R LM WR',
      aperture: 1.4,
      shutterSpeed: '1/250',
      iso: 800,
    });
  });

  it('Model が Make で始まるときは重ねない', () => {
    const result = exifToPhotoMeta({ ...raw, Make: 'NIKON', Model: 'NIKON Z 6' }, 's');
    expect(result.ok && result.meta.camera).toBe('NIKON Z 6');
  });

  it('欠けている項目名をすべて挙げる', () => {
    const result = exifToPhotoMeta({ ...raw, LensModel: undefined, ISO: undefined }, 's');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(['LensModel', 'ISO']);
  });

  it('数値項目が 0 / 負 / NaN のときは欠損として扱う', () => {
    const r = exifToPhotoMeta({ ...raw, ExposureTime: 0, ISO: Number.NaN, FNumber: -1 }, 's');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing).toEqual(['FNumber', 'ExposureTime', 'ISO']);
  });
});

describe('renderPhotoYaml', () => {
  const meta: PhotoMeta = {
    slug: 'kamo-river-dawn',
    takenAt: '2025-11-03',
    camera: 'FUJIFILM X-T5',
    lens: 'XF23mmF1.4 R LM WR',
    aperture: 1.4,
    shutterSpeed: '1/250',
    iso: 800,
  };
  const yaml = renderPhotoYaml(meta, 'https://example.com/kamo-river-dawn.jpg', 20, false);

  it('EXIF と URL と order と featured を埋める', () => {
    expect(yaml).toContain('image: "https://example.com/kamo-river-dawn.jpg"');
    expect(yaml).toContain('order: 20');
    expect(yaml).toContain('featured: false');
    expect(yaml).toContain('takenAt: 2025-11-03');
    expect(yaml).toContain('shutterSpeed: "1/250"');
    expect(yaml).toContain('iso: 800');
  });

  it('人が書く 3 項目には未記入の印を入れる', () => {
    for (const field of ['title', 'location', 'alt']) {
      expect(yaml).toMatch(new RegExp(`^${field}:.*TODO:.*TODO:`, 'm'));
    }
  });

  it('引用符を含む値を壊さない', () => {
    const odd = renderPhotoYaml({ ...meta, lens: 'a "b": c' }, 'https://e/x.jpg', 10, true);
    expect(odd).toContain('lens: "a \\"b\\": c"');
  });
});
