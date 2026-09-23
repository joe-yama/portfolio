import { getCollection, getEntry } from 'astro:content';
import type { Career, PhotoEntry, Profile } from '../content/schemas';
import type { Locale } from './i18n';
import {
  assertValid,
  validateCareerParity,
  validateCareerPatents,
  validatePhotos,
} from './validate';

export async function getProfile(lang: Locale): Promise<Profile> {
  const entry = await getEntry('profile', lang);
  if (!entry) throw new Error(`profile/${lang}.yaml が無い`);
  return entry.data;
}

export async function getCareer(lang: Locale): Promise<Career> {
  const [ja, en] = await Promise.all([getEntry('career', 'ja'), getEntry('career', 'en')]);
  if (!ja || !en) throw new Error('career/ja.yaml と career/en.yaml の両方が必要');
  // 1 回にまとめて投げる。言語ごとに投げると ja のエラーが en のエラーを隠す（design D4）
  assertValid(
    [
      ...validateCareerParity(ja.data, en.data),
      ...validateCareerPatents(ja.data, 'ja'),
      ...validateCareerPatents(en.data, 'en'),
    ],
    'career',
  );
  return lang === 'ja' ? ja.data : en.data;
}

/**
 * 写真の一覧。並び順の決定はここだけで行い、ギャラリー・前後リンク・代表写真は
 * すべて同じ配列を見る（設計 D1）。集合の制約に反していればビルドを止める
 */
export async function getPhotos(): Promise<PhotoEntry[]> {
  const entries = await getCollection('photos');
  const photos = entries.map((e) => ({ id: e.id, data: e.data }));
  assertValid(validatePhotos(photos), 'photos');
  return photos.sort((a, b) => a.data.order - b.data.order);
}

/** 代表写真。getPhotos の検証が「ちょうど 1 枚」を保証するので、写真が 0 枚ならそこで止まる */
export async function getFeaturedPhoto(): Promise<PhotoEntry> {
  const featured = (await getPhotos()).find((p) => p.data.featured);
  if (!featured) throw new Error('到達しない: 検証を通った写真に featured が無い');
  return featured;
}
