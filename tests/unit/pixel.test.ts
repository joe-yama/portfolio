import { describe, expect, it } from 'vitest';
import { camera, cells, lost } from '../../src/lib/pixel';

describe('cells', () => {
  it('# のセル座標を行優先で返す', () => {
    expect(cells(['#.', '.#'])).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]);
  });

  it('# が無ければ空', () => {
    expect(cells(['..', '..'])).toEqual([]);
  });
});

describe.each([
  ['camera', camera],
  ['lost', lost],
])('%s', (_name, rows) => {
  it('16 行 × 16 文字で、. と # だけからなる', () => {
    expect(rows).toHaveLength(16);
    for (const row of rows) {
      expect(row).toHaveLength(16);
      expect(row).toMatch(/^[.#]{16}$/);
    }
  });

  it('少なくとも 1 セルは塗られている', () => {
    expect(cells(rows).length).toBeGreaterThan(0);
  });
});
