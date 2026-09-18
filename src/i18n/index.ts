import { en } from './en';
import { ar } from './ar';

/**
 * Tiny bilingual (English / Arabic) i18n layer — no external dependency.
 *
 * - `en` is the source of truth for the key set; `ar` mirrors it.
 * - `t(key, params)` looks up a key and interpolates {placeholders}.
 * - Missing keys fall back to English, then to the raw key, so the UI never
 *   renders `undefined`.
 */

export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Text direction for a locale — drives the <html dir> attribute and RTL CSS. */
export const LOCALE_DIR: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

const dictionaries: Record<Locale, Record<string, string>> = { en, ar };

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'ar';
}

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/** Builds a translator bound to a single locale. */
export function createTranslator(locale: Locale): TranslateFn {
  const dict = dictionaries[locale];
  return (key, params) => {
    const template = dict[key] ?? en[key] ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      params[name] !== undefined ? String(params[name]) : match,
    );
  };
}
