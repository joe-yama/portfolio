import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { careerSchema, photoSchema, profileSchema, projectSchema } from './content/schemas';
import { photoIdFromEntry } from './lib/photo-meta';

const profile = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/profile' }),
  schema: profileSchema,
});

const career = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/career' }),
  schema: careerSchema,
});

const photos = defineCollection({
  loader: glob({
    pattern: '*.yaml',
    base: './src/content/photos',
    generateId: ({ entry }) => photoIdFromEntry(entry),
  }),
  schema: photoSchema,
});

/** 開発物は 1 件 1 ファイル。ファイル名（拡張子を除く）が slug（design D1） */
const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: projectSchema,
});

export const collections = { profile, career, photos, projects };
