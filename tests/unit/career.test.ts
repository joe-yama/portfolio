import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatMonth,
  formatPeriod,
  sortByDateDesc,
  sortExperience,
  sortPatents,
} from '../../src/lib/career';

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
    // 同じ月の項目を「日付が早いほうを先」に並べて入力する。
    // 月までで切り詰めるキー（'2024-10'）だと同値になり安定ソートで入力順のまま残るため、
    // 日単位まで比較できていないと期待値と逆順になり検出できる
    const items = [
      { date: '2023-06-01' },
      { date: '2024-10-02' },
      { date: '2024-10-12' },
      { date: '2024-01-05' },
    ];
    expect(sortByDateDesc(items).map((i) => i.date)).toEqual([
      '2024-10-12',
      '2024-10-02',
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

const patents = [
  { number: 'A', filedAt: '2019-10', title: 't', countries: ['JP'] },
  { number: 'B', filedAt: '2021-03', title: 't', countries: ['JP', 'CN', 'TW'] },
  { number: 'C', filedAt: '2020-01', title: 't', countries: ['JP', 'CN'] },
  { number: 'D', filedAt: '2021-03', title: 't', countries: ['JP', 'CN'] },
  { number: 'E', filedAt: '2021-03', title: 't', countries: ['JP', 'CN'] },
  { number: 'F', filedAt: '2021-03', title: 't', countries: ['JP', 'CN'] },
];

describe('sortPatents', () => {
  it('countries の件数の降順に並べる', () => {
    const twoOnly = [patents[0], patents[1]];
    expect(sortPatents(twoOnly).map((p) => p.number)).toEqual(['B', 'A']);
  });

  it('countries の件数が同じなら filedAt の降順に並べる', () => {
    const sameCount = [patents[2], patents[3]];
    expect(sortPatents(sameCount).map((p) => p.number)).toEqual(['D', 'C']);
  });

  it('countries と filedAt が同じなら記述順を保つ（安定ソート）', () => {
    const tied = [patents[3], patents[4], patents[5]];
    expect(sortPatents(tied).map((p) => p.number)).toEqual(['D', 'E', 'F']);
  });

  it('元の配列を破壊しない', () => {
    const before = patents.map((p) => p.number);
    sortPatents(patents);
    expect(patents.map((p) => p.number)).toEqual(before);
  });
});

describe('formatMonth', () => {
  it('ja は YYYY年M月', () => {
    expect(formatMonth('2021-03', 'ja')).toBe('2021年3月');
  });

  it('en は 短縮月 年', () => {
    expect(formatMonth('2021-03', 'en')).toBe('Mar 2021');
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

  it('年月までの日付は ja で 年月（日を補わない）', () => {
    expect(formatDate('2025-10', 'ja')).toBe('2025年10月');
  });

  it('年月までの日付は en で 月 年', () => {
    expect(formatDate('2025-10', 'en')).toBe('October 2025');
  });

  it('年月日までの日付はこれまでどおり日まで出す', () => {
    expect(formatDate('2017-08-31', 'ja')).toBe('2017年8月31日');
    expect(formatDate('2017-08-31', 'en')).toBe('August 31, 2017');
  });
});

describe('負のオフセットの環境でのタイムゾーン退行の検出', () => {
  it('負のオフセットの環境でも 1 月が前年 12 月にならない', () => {
    const saved = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      expect(formatPeriod('2020-01', '2020-01', 'en')).toBe('Jan 2020 – Jan 2020');
      expect(formatDate('2024-01-01', 'en')).toBe('January 1, 2024');
      expect(formatDate('2025-01', 'en')).toBe('January 2025');
    } finally {
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    }
  });
});
