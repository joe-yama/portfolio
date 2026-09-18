import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { careerSchema, profileSchema } from './content/schemas';

const profile = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/profile' }),
  schema: profileSchema,
});

const career = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/career' }),
  schema: careerSchema,
});

export const collections = { profile, career };
