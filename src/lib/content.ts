import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import type { Career, Profile } from '../content/schemas';
import type { Locale } from './i18n';
import { assertValid, validateCareerParity, validatePhotos } from './validate';

export async function getPhotos(): Promise<CollectionEntry<'photos'>[]> {
  const entries = await getCollection('photos');
  assertValid(validatePhotos(entries), 'photos');
  return [...entries].sort((a, b) => a.data.order - b.data.order);
}

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
