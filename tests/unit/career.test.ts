import { describe, expect, it } from 'vitest';
import type { Patent } from '../../src/content/schemas';
import {
  formatDate,
  formatGroupPeriod,
  formatMonth,
  formatPeriod,
  groupCertifications,
  hasDay,
  sortByDateDesc,
  sortExperience,
  sortPatents,
  splitPatents,
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

function patent(number: string, filedAt: string, countries: string[]): Patent {
  return { number, filedAt, countries, title: 't', url: 'https://example.com/' };
}

/** 呼ぶたびに新しい配列を返す（テストどうしで状態を共有しない） */
function patents(): Patent[] {
  return [
    patent('A', '2019-10', ['JP']),
    patent('B', '2021-03', ['JP', 'CN', 'TW']),
    patent('C', '2020-01', ['JP', 'CN']),
    patent('D', '2021-03', ['JP', 'CN']),
    patent('E', '2021-03', ['JP', 'CN']),
    patent('F', '2021-03', ['JP', 'CN']),
  ];
}

describe('sortPatents', () => {
  it('countries の件数の降順に並べる', () => {
    const [a, b] = patents();
    expect(sortPatents([a, b]).map((p) => p.number)).toEqual(['B', 'A']);
  });

  it('countries の件数が同じなら filedAt の降順に並べる', () => {
    const [, , c, d] = patents();
    expect(sortPatents([c, d]).map((p) => p.number)).toEqual(['D', 'C']);
  });

  it('countries と filedAt が同じなら記述順を保つ（安定ソート）', () => {
    const tied = patents().slice(3);
    expect(sortPatents(tied).map((p) => p.number)).toEqual(['D', 'E', 'F']);
  });

  it('元の配列を破壊しない', () => {
    const input = patents();
    const before = input.map((p) => p.number);
    sortPatents(input);
    expect(input.map((p) => p.number)).toEqual(before);
  });
});

describe('splitPatents', () => {
  const items = (n: number) =>
    Array.from({ length: n }, (_, i) => patent(String(i), '2021-03', ['JP']));

  it('4 件なら head に 4 件、rest は空', () => {
    expect(splitPatents(items(4))).toEqual({ head: items(4), rest: [] });
  });

  it('5 件なら head に 5 件、rest は空', () => {
    expect(splitPatents(items(5))).toEqual({ head: items(5), rest: [] });
  });

  it('12 件なら head に先頭 5 件、rest に残り 7 件', () => {
    const result = splitPatents(items(12));
    expect(result.head).toEqual(items(5));
    expect(result.rest).toEqual(items(12).slice(5));
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
    expect(formatPeriod('2017-04', '2020-03', 'ja', '現在')).toBe('2017年4月 – 2020年3月');
  });

  it('en は 短縮月 年 – 短縮月 年', () => {
    expect(formatPeriod('2017-04', '2020-03', 'en', 'Present')).toBe('Apr 2017 – Mar 2020');
  });

  it('to が undefined なら present に渡した在職中の表記になる', () => {
    expect(formatPeriod('2020-04', undefined, 'ja', '現在')).toBe('2020年4月 – 現在');
    expect(formatPeriod('2020-04', undefined, 'en', 'Present')).toBe('Apr 2020 – Present');
  });

  it('to が null でも present に渡した在職中の表記になる', () => {
    expect(formatPeriod('2020-04', null, 'ja', '現在')).toBe('2020年4月 – 現在');
  });

  it('1 月を前年 12 月に丸めない（ローカル時刻で組み立てる）', () => {
    expect(formatPeriod('2020-01', '2020-01', 'en', 'Present')).toBe('Jan 2020 – Jan 2020');
  });
});

describe('hasDay', () => {
  it('YYYY-MM-DD なら true、YYYY-MM なら false', () => {
    expect(hasDay('2024-10-12')).toBe(true);
    expect(hasDay('2024-10')).toBe(false);
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
      expect(formatPeriod('2020-01', '2020-01', 'en', 'Present')).toBe('Jan 2020 – Jan 2020');
      expect(formatDate('2024-01-01', 'en')).toBe('January 1, 2024');
      expect(formatDate('2025-01', 'en')).toBe('January 2025');
    } finally {
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    }
  });
});

describe('groupCertifications', () => {
  const a = { date: '2026-05', name: 'A' };
  const aws1 = { date: '2025-10', name: 'AWS 1', group: 'AWS 認定' };
  const aws2 = { date: '2025-04', name: 'AWS 2', group: 'AWS 認定' };
  const b = { date: '2020-07', name: 'B' };

  it('グループは最も新しい資格の位置に 1 項目で置かれ、前後の資格はそのまま残る', () => {
    const result = groupCertifications([a, aws1, aws2, b]);
    expect(result).toEqual([
      { kind: 'single', item: a },
      { kind: 'group', name: 'AWS 認定', items: [aws1, aws2] },
      { kind: 'single', item: b },
    ]);
  });

  it('グループの間に別の資格が挟まっても、グループの中は新しい順にまとまる', () => {
    const result = groupCertifications([aws1, a, aws2]);
    expect(result).toEqual([
      { kind: 'group', name: 'AWS 認定', items: [aws1, aws2] },
      { kind: 'single', item: a },
    ]);
  });

  it('group を持たない資格だけなら、すべて single のまま順を保つ', () => {
    expect(groupCertifications([a, b])).toEqual([
      { kind: 'single', item: a },
      { kind: 'single', item: b },
    ]);
  });
});

describe('formatGroupPeriod', () => {
  const items = [{ date: '2025-10' }, { date: '2025-09' }, { date: '2025-04' }];

  it('ja は 古い – 新しい', () => {
    expect(formatGroupPeriod(items, 'ja')).toBe('2025年4月 – 2025年10月');
  });

  it('en は 古い – 新しい', () => {
    expect(formatGroupPeriod(items, 'en')).toBe('April 2025 – October 2025');
  });

  it('同じ月だけのグループは 1 つだけ出し、– を含まない', () => {
    expect(formatGroupPeriod([{ date: '2025-10' }, { date: '2025-10' }], 'ja')).toBe('2025年10月');
  });
});
