import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { camera, faviconSvg } from '../../src/lib/pixel';
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

  it('コメントアウトされたトークンは無いものとして例外にする', () => {
    const commented = css.replace('--line: #8f8f8f;', '/* --line: #8f8f8f; */');
    expect(() => readTokens(commented)).toThrow();
  });

  it('再宣言があれば CSS と同じ後勝ちの値を読む', () => {
    const redeclared = css.replace('--line: #8f8f8f;', '--line: #8f8f8f;\n  --line: #f5f5f5;');
    expect(readTokens(redeclared).light.line).toBe('#f5f5f5');
  });

  it('6 桁の宣言の後に 3 桁で再宣言されていれば、前の値に戻らず例外にする', () => {
    const redeclared = css.replace('--line: #8f8f8f;', '--line: #8f8f8f;\n  --line: #fff;');
    expect(() => readTokens(redeclared)).toThrow(/--line が 6 桁の 16 進でない: #fff/);
  });

  it('3 桁や 8 桁の色は抽出の時点で例外にする（輝度計算が 6 桁だけを扱うため）', () => {
    const cssWithBg = (bg: string) =>
      `:root { --bg: ${bg}; --fg: #111111; --fg-muted: #5c5c5c; --line: #8f8f8f; }
@media (prefers-color-scheme: dark) { :root { --bg: #0c0c0c; --fg: #e8e8e8; --fg-muted: #9a9a9a; --line: #606060; } }`;
    expect(() => readTokens(cssWithBg('#fff'))).toThrow(/--bg が 6 桁の 16 進でない: #fff/);
    expect(() => readTokens(cssWithBg('#fafafa80'))).toThrow(
      /--bg が 6 桁の 16 進でない: #fafafa80/,
    );
    expect(readTokens(cssWithBg('#fafafa')).light.bg).toBe('#fafafa');
  });
});

describe('src/styles/global.css の検算', () => {
  const globalCssPath = fileURLToPath(new URL('../../src/styles/global.css', import.meta.url));
  const tokens = readTokens(readFileSync(globalCssPath, 'utf-8'));

  const cases = [
    { theme: 'light' as const, key: 'fg' as const, min: 4.5 },
    { theme: 'light' as const, key: 'fgMuted' as const, min: 4.5 },
    { theme: 'light' as const, key: 'line' as const, min: 3.0 },
    { theme: 'dark' as const, key: 'fg' as const, min: 4.5 },
    { theme: 'dark' as const, key: 'fgMuted' as const, min: 4.5 },
    { theme: 'dark' as const, key: 'line' as const, min: 3.0 },
  ];

  it.each(cases)('$theme の $key / bg は $min 以上', ({ theme, key, min }) => {
    const c = contrast(tokens[theme][key], tokens[theme].bg);
    expect(
      c,
      `${theme} の --${key} と --bg のコントラスト比は ${c.toFixed(3)} で、下限 ${min} を割った`,
    ).toBeGreaterThanOrEqual(min);
  });

  it('faviconSvg(camera) にライトの --fg とダークの --fg が含まれる', () => {
    const svg = faviconSvg(camera);
    expect(svg).toContain(`fill="${tokens.light.fg}"`);
    expect(svg).toContain(`fill:${tokens.dark.fg}`);
  });
});
