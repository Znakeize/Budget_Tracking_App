
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { zh } from './locales/zh';
import { ja } from './locales/ja';
import { si } from './locales/si';

export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Chinese' | 'Japanese' | 'Sinhala';

export const translations: Record<Language, Record<string, string>> = {
  English: en,
  Spanish: es,
  French: fr,
  German: de,
  Chinese: zh,
  Japanese: ja,
  Sinhala: si
};
