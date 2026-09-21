import { describe, expect, it } from 'vitest';
import { contrast } from '../../src/lib/theme';

describe('contrast', () => {
  it('黒と白は 21', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('同じ色は 1', () => {
    expect(contrast('#8f8f8f', '#8f8f8f')).toBeCloseTo(1, 5);
  });

  it('#8f8f8f と #fafafa は 3.0〜3.2 の範囲', () => {
    const c = contrast('#8f8f8f', '#fafafa');
    expect(c).toBeGreaterThanOrEqual(3.0);
    expect(c).toBeLessThanOrEqual(3.2);
  });
});
