import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { careerSchema, photoSchema, profileSchema } from './content/schemas';
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

export const collections = { profile, career, photos };
