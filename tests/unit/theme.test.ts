import { describe, expect, it } from 'vitest';
import { contrast, readTokens } from '../../src/lib/theme';

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

describe('readTokens', () => {
  const css = `
:root {
  --bg: #fafafa;
  --fg: #111111;
  --fg-muted: #5c5c5c;
  --line: #8f8f8f;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0c0c0c;
    --fg: #e8e8e8;
    --fg-muted: #9a9a9a;
    --line: #606060;
  }
}
`;

  it(':root とダークのブロックから 4 トークンを抜く', () => {
    expect(readTokens(css)).toEqual({
      light: { bg: '#fafafa', fg: '#111111', fgMuted: '#5c5c5c', line: '#8f8f8f' },
      dark: { bg: '#0c0c0c', fg: '#e8e8e8', fgMuted: '#9a9a9a', line: '#606060' },
    });
  });

  it('トークンが欠けていれば例外', () => {
    const missing = css.replace('--line: #8f8f8f;', '');
    expect(() => readTokens(missing)).toThrow();
  });
});
