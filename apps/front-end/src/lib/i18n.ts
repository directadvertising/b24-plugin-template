import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/translations/en.json";
import rs from "@/translations/rs.json";

export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = ["en", "rs"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const defaultNS = "translation";

export const resources = {
  en: { translation: en },
  rs: { translation: rs },
} as const;

/**
 * Map Bitrix24 portal language codes (from `$b24.getLang()`) onto our
 * supported locales. Anything unmapped falls back to {@link DEFAULT_LOCALE}.
 */
const B24_LANG_MAP: Record<string, SupportedLocale> = {
  en: "en",
  sr: "rs",
  rs: "rs",
};

export function resolveLocale(lang?: string | null): SupportedLocale {
  if (!lang) return DEFAULT_LOCALE;
  const normalized = lang.toLowerCase().split("-")[0];
  return B24_LANG_MAP[normalized] ?? DEFAULT_LOCALE;
}

i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

/**
 * Switch the app language from a Bitrix24 portal lang code.
 * Wire this into `useB24Init`'s `onLocaleDetected` callback.
 */
export function setAppLanguage(lang: string): Promise<unknown> {
  return i18n.changeLanguage(resolveLocale(lang));
}

export default i18n;
