import { z } from 'astro/zod';

/** 写真の元画像を置く GitHub Release（タグ photos）の asset URL の接頭辞 */
export const PHOTO_BASE_URL = 'https://github.com/joe-yama/portfolio/releases/download/photos/';

const nonEmpty = z.string().trim().min(1);

export const localizedSchema = z.object({ ja: nonEmpty, en: nonEmpty });
export type Localized = z.infer<typeof localizedSchema>;

/** 暦として実在する日か（`2025-02-30` のように形式は合っていても存在しない日を弾く） */
function isCalendarDate(y: number, m: number, d: number): boolean {
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** YYYY-MM */
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'YYYY-MM 形式で書く');
/** YYYY-MM-DD。暦に存在しない日（2025-02-30 など）は refine で弾く */
const isoDate = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'YYYY-MM-DD 形式で書く')
  .refine((s) => {
    const [y, m, d] = s.split('-').map(Number);
    return isCalendarDate(y, m, d);
  }, '暦に存在しない日');

/**
 * YYYY-MM または YYYY-MM-DD。資格・実績は分かっている粒度で書く（design D1）。
 * YYYY-MM-DD のときだけ、暦に存在しない日（2025-02-30 など）を refine で弾く
 * （YYYY-MM は月の範囲を正規表現が保証済みなので追加の検査は要らない）
 */
const datePrecision = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/, 'YYYY-MM または YYYY-MM-DD 形式で書く')
  .refine((s) => {
    const parts = s.split('-').map(Number);
    if (parts.length === 2) return true;
    const [y, m, d] = parts;
    return isCalendarDate(y, m, d);
  }, '暦に存在しない日');

export const exifSchema = z.object({
  camera: nonEmpty,
  lens: nonEmpty,
  aperture: z.number().positive(),
  shutterSpeed: nonEmpty,
  iso: z.number().int().positive(),
});
export type Exif = z.infer<typeof exifSchema>;

export const photoSchema = z.object({
  image: z.url(),
  order: z.number().int(),
  featured: z.boolean().default(false),
  // 文字列のみ受ける（Date は受けない）。js-yaml はクォート無しの日付を Date に
  // してしまい、暦の refine を素通りするため、YAML 側でクォートを強制する（レビュー I1）
  takenAt: isoDate.transform((s) => new Date(s)),
  title: localizedSchema,
  location: localizedSchema,
  alt: localizedSchema,
  exif: exifSchema,
});
export type Photo = z.infer<typeof photoSchema>;
export type PhotoEntry = { id: string; data: Photo };

export const experienceSchema = z.object({
  from: yearMonth,
  to: yearMonth.nullish(), // 省略 or null = 在職中
  organization: nonEmpty,
  role: nonEmpty,
  bullets: z.array(nonEmpty).max(5),
});

/**
 * 日付付きの項目（資格・実績の共通部分）。`logo` は資格のバッジ画像パス用の任意項目
 * （design D7）。achievements 側では使わない運用（spec は MUST NOT）
 */
const datedItemSchema = z.object({
  date: datePrecision,
  name: nonEmpty,
  url: z.url().optional(),
  logo: z.string().optional(),
});

/** 実績の種別。site.ts の achievementKind とここでの二重定義を避け、ここを正本にする */
export const achievementKindSchema = z.enum(['talk', 'article', 'award', 'other']);
export type AchievementKind = z.infer<typeof achievementKindSchema>;

export const patentSchema = z.object({
  filedAt: yearMonth,
  title: nonEmpty,
  number: nonEmpty,
  countries: z.array(nonEmpty).min(1),
  url: z.url().optional(),
});
export type Patent = z.infer<typeof patentSchema>;

export const careerSchema = z
  .object({
    experience: z.array(experienceSchema),
    skills: z.record(nonEmpty, z.array(nonEmpty)),
    certifications: z.array(datedItemSchema),
    achievements: z.array(datedItemSchema.extend({ kind: achievementKindSchema })),
    patents: z.array(patentSchema),
  })
  .superRefine((data, ctx) => {
    // skills のキー違反は z.record のキースキーマだと invalid_key issue に入れ子で
    // 入り、Astro は最上位 issue の message しか出さない。superRefine でトップ
    // レベルの issue にする（レビュー I2）。数字だけのカテゴリ名を禁止する理由は
    // JavaScript のオブジェクトが整数に見えるキーを先頭に繰り上げ、
    // Object.entries の順が記述順にならないため
    for (const key of Object.keys(data.skills)) {
      if (/^\d+$/.test(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['skills', key],
          message: 'カテゴリ名が数字だけになっている',
        });
      }
    }
  });
export type Career = z.infer<typeof careerSchema>;

export const profileSchema = z.object({
  name: nonEmpty,
  tagline: nonEmpty,
  links: z.array(
    z.object({
      label: nonEmpty,
      url: z.url(),
      kind: z.enum(['github', 'email', 'x', 'linkedin', 'other']),
    }),
  ),
});
export type Profile = z.infer<typeof profileSchema>;
