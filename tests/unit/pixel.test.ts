import { describe, expect, it } from 'vitest';
import { camera, cells, gridSize, lost } from '../../src/lib/pixel';

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

  it('空配列なら空', () => {
    expect(cells([])).toEqual([]);
  });
});

describe('gridSize', () => {
  it('空配列なら 0 × 0', () => {
    expect(gridSize([])).toEqual({ width: 0, height: 0 });
  });

  it('行長が不揃いなら最長行を幅にする', () => {
    expect(gridSize(['#', '##'])).toEqual({ width: 2, height: 2 });
  });

  it('縦長の格子でも幅と高さを取り違えない', () => {
    expect(gridSize(['#', '##', '#'])).toEqual({ width: 2, height: 3 });
  });

  it('16 × 16 の絵は 16 × 16', () => {
    expect(gridSize(camera)).toEqual({ width: 16, height: 16 });
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

  it('全面塗りではない', () => {
    expect(cells(rows).length).toBeLessThan(256);
  });
});
