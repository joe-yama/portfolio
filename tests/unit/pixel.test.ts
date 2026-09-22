import { describe, expect, it } from 'vitest';
import {
  briefcase,
  camera,
  cells,
  faviconSvg,
  github,
  globe,
  gridSize,
  linkedin,
  lost,
} from '../../src/lib/pixel';

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

  it('サロゲートペアの文字でも cells と同じ数え方で幅を出す', () => {
    expect(gridSize(['💩💩'])).toEqual({ width: 2, height: 1 });
  });
});

describe('faviconSvg', () => {
  it('絵の大きさの viewBox と、ぼかさない指定を持つ', () => {
    const svg = faviconSvg(camera);
    expect(svg).toContain('viewBox="0 0 16 16"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('幅と高さが違う絵でも viewBox を取り違えない', () => {
    expect(faviconSvg(['#', '##'])).toContain('viewBox="0 0 2 2"');
  });

  it('塗られたセルの数だけ rect を出す', () => {
    expect(faviconSvg(camera).match(/<rect /g)).toHaveLength(cells(camera).length);
  });

  it('ライトは暗色、ダークは明色', () => {
    const svg = faviconSvg(camera);
    expect(svg).toContain('fill="#111111"');
    expect(svg).toContain('prefers-color-scheme: dark');
    expect(svg).toContain('rect{fill:#e8e8e8}');
  });

  it('名前空間以外に外部への参照を持たない', () => {
    expect(faviconSvg(camera).replace(/xmlns="[^"]*"/g, '')).not.toContain('//');
  });
});

describe.each([
  ['camera', camera],
  ['lost', lost],
  ['github', github],
  ['linkedin', linkedin],
  ['briefcase', briefcase],
  ['globe', globe],
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
