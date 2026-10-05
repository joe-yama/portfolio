import { describe, expect, it, vi } from 'vitest';
import { projectSchema } from '../../src/content/schemas';

// content.config.ts が photos の glob loader に generateId を渡していることの番人（design D2）。
// glob を差し替えて受け取ったオプションを返させ、generateId を直接呼ぶ
vi.mock('astro/loaders', () => ({ glob: (options: unknown) => options }));
vi.mock('astro:content', () => ({ defineCollection: (config: unknown) => config }));

const { collections } = await import('../../src/content.config');

describe('写真コレクションの id', () => {
  it('ファイル名（拡張子を除く）をそのまま id にする', () => {
    // loader は DataCollectionConfig 側に無い（型の union）ので、コレクションごと差し替え後の形に見る
    const { loader } = collections.photos as unknown as {
      loader: { generateId?: (options: { entry: string }) => string };
    };
    expect(loader.generateId?.({ entry: 'kamo-river-v1.2.yaml' })).toBe('kamo-river-v1.2');
    expect(loader.generateId?.({ entry: 'Kamo.yaml' })).toBe('Kamo');
  });
});

describe('開発物コレクション', () => {
  it('projects を src/content/projects の YAML から projectSchema で読む', () => {
    const { loader, schema } = collections.projects as unknown as {
      loader: { pattern: string; base: string };
      schema: unknown;
    };
    expect(loader).toMatchObject({ pattern: '*.yaml', base: './src/content/projects' });
    expect(schema).toBe(projectSchema);
  });
});
