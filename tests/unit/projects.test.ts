import { describe, expect, it } from 'vitest';
import type { ProjectEntry } from '../../src/content/schemas';
import { sinceLabel, sortProjects } from '../../src/lib/projects';

function project(id: string, order: number): ProjectEntry {
  return {
    id,
    data: {
      order,
      name: id,
      url: `https://${id}.example`,
      icon: 'tomoly',
      since: 2026,
      status: { ja: 's', en: 's' },
      summary: { ja: 's', en: 's' },
      description: { ja: 'd', en: 'd' },
      tech: ['TypeScript'],
    },
  };
}

describe('sortProjects', () => {
  it('order の小さい順に並べる', () => {
    const sorted = sortProjects([project('second', 2), project('first', 1)]);
    expect(sorted.map((p) => p.data.order)).toEqual([1, 2]);
    expect(sorted.map((p) => p.id)).toEqual(['first', 'second']);
  });

  it('入力の配列を変えない', () => {
    const input = [project('second', 2), project('first', 1)];
    sortProjects(input);
    expect(input.map((p) => p.id)).toEqual(['second', 'first']);
  });
});

describe('sinceLabel', () => {
  it('日本語は <年>年〜', () => {
    expect(sinceLabel(2026, 'ja')).toBe('2026年〜');
  });

  it('英語は <年> と en ダッシュ', () => {
    expect(sinceLabel(2026, 'en')).toBe('2026–');
  });
});
