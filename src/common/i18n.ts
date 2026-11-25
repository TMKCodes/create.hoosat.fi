import i18next, { i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json" with { type: "json" };
import fi from "./locales/fi.json" with { type: "json" };

export const supportedLanguages = ["en", "fi"] as const;
export type Language = (typeof supportedLanguages)[number];
export const defaultLanguage: Language = "en";

/** Name of the cookie the language switch writes and the server reads. */
export const languageCookie = "lng";

const isLanguage = (value: string | undefined): value is Language =>
  value !== undefined && (supportedLanguages as readonly string[]).includes(value);

/**
 * Creates a fresh i18next instance for one language.
 *
 * Translations are bundled instead of fetched, and `initAsync: false` makes `init` finish synchronously.
 * That way the server and the browser render the very same markup on the first pass, so hydration never
 * sees untranslated keys. The server creates one instance per request, so concurrent requests in
 * different languages can not leak into each other.
 */
export const createI18n = (lng: string | undefined): I18nInstance => {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    resources: { en: { translation: en }, fi: { translation: fi } },
    lng: isLanguage(lng) ? lng : defaultLanguage,
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
};

/**
 * Picks the language for a request: an explicit cookie wins, then the browser's Accept-Language header.
 */
export const pickLanguage = (cookieHeader?: string, acceptLanguage?: string): Language => {
  const cookieValue = cookieHeader
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === languageCookie)?.[1];
  if (isLanguage(cookieValue)) {
    return cookieValue;
  }
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.trim().slice(0, 2).toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((entry) => entry.lang !== "" && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q)
    .find((entry) => isLanguage(entry.lang));
  return preferred ? (preferred.lang as Language) : defaultLanguage;
};
