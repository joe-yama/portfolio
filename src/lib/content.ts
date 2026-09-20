import { getCollection, getEntry } from 'astro:content';
import type { Career, Profile } from '../content/schemas';
import type { Locale } from './i18n';
import { assertValid, type PhotoEntry, validateCareerParity, validatePhotos } from './validate';

export async function getProfile(lang: Locale): Promise<Profile> {
  const entry = await getEntry('profile', lang);
  if (!entry) throw new Error(`profile/${lang}.yaml が無い`);
  return entry.data;
}

export async function getCareer(lang: Locale): Promise<Career> {
  const [ja, en] = await Promise.all([getEntry('career', 'ja'), getEntry('career', 'en')]);
  if (!ja || !en) throw new Error('career/ja.yaml と career/en.yaml の両方が必要');
  assertValid(validateCareerParity(ja.data, en.data), 'career');
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
