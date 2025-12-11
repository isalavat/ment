import { en } from './en';
import { ru } from './ru';
import { ky } from './ky';

export const locales = {
  en,
  ru,
  ky
};

export type Locale = keyof typeof locales;
export type TranslationKeys = typeof en;
