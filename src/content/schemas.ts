import { z } from 'astro/zod';

/** 写真の元画像を置く GitHub Release（タグ photos）の asset URL の接頭辞 */
export const PHOTO_BASE_URL = 'https://github.com/joe-yama/portfolio/releases/download/photos/';

const nonEmpty = z.string().trim().min(1);

export const localizedSchema = z.object({ ja: nonEmpty, en: nonEmpty });
export type Localized = z.infer<typeof localizedSchema>;

/** YYYY-MM */
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'YYYY-MM 形式で書く');
/** YYYY-MM-DD */
const isoDate = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'YYYY-MM-DD 形式で書く');

export const exifSchema = z.object({
  camera: nonEmpty,
  lens: nonEmpty,
  aperture: z.number().positive(),
  shutterSpeed: nonEmpty,
  iso: z.number().int().positive(),
});

export const photoSchema = z.object({
  image: z.url(),
  order: z.number().int().positive(),
  featured: z.boolean().default(false),
  takenAt: z.coerce.date(),
  title: localizedSchema,
  location: localizedSchema,
  alt: localizedSchema,
  exif: exifSchema,
});
export type Photo = z.infer<typeof photoSchema>;

export const experienceSchema = z.object({
  from: yearMonth,
  to: yearMonth.nullish(), // 省略 or null = 在職中
  organization: nonEmpty,
  role: nonEmpty,
  bullets: z.array(nonEmpty).max(5),
});

export const careerSchema = z.object({
  experience: z.array(experienceSchema),
  skills: z.record(nonEmpty, z.array(nonEmpty)),
  certifications: z.array(z.object({ date: isoDate, name: nonEmpty, url: z.url().optional() })),
  achievements: z.array(
    z.object({
      date: isoDate,
      name: nonEmpty,
      url: z.url().optional(),
      kind: z.enum(['talk', 'article', 'award', 'other']),
    }),
  ),
});
export type Career = z.infer<typeof careerSchema>;

export const profileSchema = z.object({
  name: nonEmpty,
  tagline: nonEmpty,
  links: z
    .array(
      z.object({
        label: nonEmpty,
        url: z.url(),
        kind: z.enum(['github', 'email', 'x', 'linkedin', 'other']),
      }),
    )
    .min(1),
});
export type Profile = z.infer<typeof profileSchema>;
