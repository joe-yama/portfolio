import { describe, expect, it } from 'vitest';
import {
  exifToPhotoMeta,
  formatShutterSpeed,
  formatTakenAtYmd,
  ghFailureMessage,
  hasFeaturedFlag,
  isReleaseNotFound,
  nextOrder,
  type PhotoMeta,
  parseOrder,
  renderPhotoYaml,
  toSlug,
  translateMissingFields,
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

  it('--slug にパス区切りを含む値は例外にする（加工せず拒否する）', () => {
    expect(() => toSlug('x.jpg', '../a')).toThrow();
    expect(() => toSlug('x.jpg', '../../pwned')).toThrow();
    expect(() => toSlug('x.jpg', 'a/b')).toThrow();
    expect(() => toSlug('x.jpg', 'a\\b')).toThrow();
  });

  it('--slug に空白を含む値は例外にする（加工せず拒否する）', () => {
    expect(() => toSlug('x.jpg', 'kamo river')).toThrow();
  });

  it('--slug が . から始まる値は例外にする', () => {
    expect(() => toSlug('x.jpg', '.hidden')).toThrow();
  });

  it('--slug が . で終わる値は例外にする（先頭の . と対称に拒否する）', () => {
    expect(() => toSlug('x.jpg', 'kamo-river.')).toThrow('kamo-river.');
    expect(() => toSlug('x.jpg', 'kamo-river-v1.2.')).toThrow();
  });

  it('途中の . は拒否しない', () => {
    expect(toSlug('x.jpg', 'kamo-river-v1.2')).toBe('kamo-river-v1.2');
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

describe('parseOrder', () => {
  it('order の値を読む', () => {
    expect(parseOrder('image: "x"\norder: 30\nfeatured: false\n')).toBe(30);
  });

  it('order が無ければ 0', () => {
    expect(parseOrder('image: "x"\nfeatured: false\n')).toBe(0);
  });

  it('先頭が - の値も読む', () => {
    expect(parseOrder('order: -5\n')).toBe(-5);
  });

  it('order: が行頭でなければ無視する（引用符の中などの文字列に惑わされない）', () => {
    expect(parseOrder('title: "sortorder: 5"\n')).toBe(0);
  });
});

describe('hasFeaturedFlag', () => {
  it('featured: true があれば真', () => {
    expect(hasFeaturedFlag('order: 10\nfeatured: true\n')).toBe(true);
  });

  it('featured: true が無ければ偽', () => {
    expect(hasFeaturedFlag('order: 10\nfeatured: false\n')).toBe(false);
  });

  it('featured: true が行頭でなければ（引用符の中の文字列など）真にしない', () => {
    expect(hasFeaturedFlag('alt: "not featured: true really"\n')).toBe(false);
  });

  it('featured: true の後ろに他の文字が続く行は真にしない', () => {
    expect(hasFeaturedFlag('featured: true-ish\n')).toBe(false);
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

const raw: Record<string, unknown> = {
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
    const result = exifToPhotoMeta(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.meta).toEqual({
      takenAt: '2025-11-03',
      camera: 'FUJIFILM X-T5',
      lens: 'XF23mmF1.4 R LM WR',
      aperture: 1.4,
      shutterSpeed: '1/250',
      iso: 800,
    });
  });

  it('Model が Make で始まるときは重ねない', () => {
    const result = exifToPhotoMeta({ ...raw, Make: 'NIKON', Model: 'NIKON Z 6' });
    expect(result.ok && result.meta.camera).toBe('NIKON Z 6');
  });

  it('欠けている項目名をすべて挙げる', () => {
    const result = exifToPhotoMeta({ ...raw, LensModel: undefined, ISO: undefined });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missing).toEqual(['LensModel', 'ISO']);
  });

  it('数値項目が 0 / 負 / NaN のときは欠損として扱う', () => {
    const r = exifToPhotoMeta({ ...raw, ExposureTime: 0, ISO: Number.NaN, FNumber: -1 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing).toEqual(['FNumber', 'ExposureTime', 'ISO']);
  });
});

describe('renderPhotoYaml', () => {
  const meta: PhotoMeta = {
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
    expect(yaml).toContain('takenAt: "2025-11-03"');
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

describe('isReleaseNotFound', () => {
  it('終了コード 1 かつ stderr に release not found を含めば真', () => {
    expect(isReleaseNotFound({ status: 1, stderr: 'release not found' })).toBe(true);
  });

  it('終了コードが 1 でも別の理由なら偽', () => {
    expect(isReleaseNotFound({ status: 1, stderr: 'authentication required' })).toBe(false);
  });

  it('終了コードが 1 以外なら偽', () => {
    expect(isReleaseNotFound({ status: 2, stderr: 'release not found' })).toBe(false);
  });

  it('ENOENT のようなオブジェクトでは偽', () => {
    expect(isReleaseNotFound({ code: 'ENOENT' })).toBe(false);
  });
});

describe('ghFailureMessage', () => {
  it('ENOENT は gh が無いことを示す 1 行にする', () => {
    expect(ghFailureMessage({ code: 'ENOENT' })).not.toMatch(/\n/);
    expect(ghFailureMessage({ code: 'ENOENT' })).toContain('gh');
  });

  it('stderr があれば先頭行だけを使う', () => {
    expect(ghFailureMessage({ stderr: 'error: authentication required\nmore detail\n' })).toBe(
      'error: authentication required',
    );
  });

  it('stderr が無ければ message を使う', () => {
    expect(ghFailureMessage({ message: 'boom' })).toBe('boom');
  });
});

describe('translateMissingFields', () => {
  it('EXIF タグ名を spec の語彙に変換する', () => {
    expect(translateMissingFields(['LensModel'])).toEqual(['レンズ']);
    expect(translateMissingFields(['DateTimeOriginal', 'FNumber', 'ExposureTime', 'ISO'])).toEqual([
      '撮影日',
      '絞り',
      'シャッター速度',
      'ISO 感度',
    ]);
  });

  it('Make と Model がどちらも欠けていてもカメラは 1 回だけ出す', () => {
    expect(translateMissingFields(['Make', 'Model'])).toEqual(['カメラ']);
  });
});
