import { describe, expect, it } from 'vitest';
import { formatDate, formatPeriod, sortByDateDesc, sortExperience } from '../../src/lib/career';

const experience = [
  {
    from: '2017-04',
    to: '2020-03',
    organization: '例示システムズ',
    role: 'プログラマ',
    bullets: [],
  },
  { from: '2020-04', organization: 'サンプル株式会社', role: 'エンジニア', bullets: ['a', 'b'] },
];

describe('sortExperience', () => {
  it('from の新しい順に並べる', () => {
    expect(sortExperience(experience).map((e) => e.from)).toEqual(['2020-04', '2017-04']);
  });

  it('元の配列を破壊しない', () => {
    sortExperience(experience);
    expect(experience.map((e) => e.from)).toEqual(['2017-04', '2020-04']);
  });
});

describe('sortByDateDesc', () => {
  it('date の新しい順に並べる', () => {
    const items = [{ date: '2023-06-01' }, { date: '2024-10-12' }, { date: '2024-01-05' }];
    expect(sortByDateDesc(items).map((i) => i.date)).toEqual([
      '2024-10-12',
      '2024-01-05',
      '2023-06-01',
    ]);
  });

  it('元の配列を破壊しない', () => {
    const items = [{ date: '2023-06-01' }, { date: '2024-10-12' }];
    sortByDateDesc(items);
    expect(items.map((i) => i.date)).toEqual(['2023-06-01', '2024-10-12']);
  });

  it('年月までの日付をその月の 1 日として並べる', () => {
    const items = [{ date: '2025-09-30' }, { date: '2025-10' }, { date: '2025-11-01' }];
    expect(sortByDateDesc(items).map((i) => i.date)).toEqual([
      '2025-11-01',
      '2025-10',
      '2025-09-30',
    ]);
  });

  it('同じ位置になる項目は記述順を保つ（年月が先）', () => {
    const items = [
      { date: '2016-03', name: 'A' },
      { date: '2016-03-01', name: 'B' },
    ];
    expect(sortByDateDesc(items).map((i) => i.name)).toEqual(['A', 'B']);
  });

  it('同じ位置になる項目は記述順を保つ（年月日が先）', () => {
    const items = [
      { date: '2016-03-01', name: 'B' },
      { date: '2016-03', name: 'A' },
    ];
    expect(sortByDateDesc(items).map((i) => i.name)).toEqual(['B', 'A']);
  });
});

describe('formatPeriod', () => {
  it('ja は 年月 – 年月', () => {
    expect(formatPeriod('2017-04', '2020-03', 'ja')).toBe('2017年4月 – 2020年3月');
  });

  it('en は 短縮月 年 – 短縮月 年', () => {
    expect(formatPeriod('2017-04', '2020-03', 'en')).toBe('Apr 2017 – Mar 2020');
  });

  it('to が undefined なら在職中の表記になる', () => {
    expect(formatPeriod('2020-04', undefined, 'ja')).toBe('2020年4月 – 現在');
    expect(formatPeriod('2020-04', undefined, 'en')).toBe('Apr 2020 – Present');
  });

  it('to が null でも在職中の表記になる', () => {
    expect(formatPeriod('2020-04', null, 'ja')).toBe('2020年4月 – 現在');
  });

  it('1 月を前年 12 月に丸めない（ローカル時刻で組み立てる）', () => {
    expect(formatPeriod('2020-01', '2020-01', 'en')).toBe('Jan 2020 – Jan 2020');
  });
});

describe('formatDate', () => {
  it('ja は 年月日', () => {
    expect(formatDate('2023-06-01', 'ja')).toBe('2023年6月1日');
  });

  it('en は 月 日, 年', () => {
    expect(formatDate('2024-10-12', 'en')).toBe('October 12, 2024');
  });

  it('月初を前月に丸めない', () => {
    expect(formatDate('2024-01-01', 'en')).toBe('January 1, 2024');
  });
});

describe('負のオフセットの環境でのタイムゾーン退行の検出', () => {
  it('負のオフセットの環境でも 1 月が前年 12 月にならない', () => {
    const saved = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      expect(formatPeriod('2020-01', '2020-01', 'en')).toBe('Jan 2020 – Jan 2020');
      expect(formatDate('2024-01-01', 'en')).toBe('January 1, 2024');
    } finally {
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    }
  });
});
