import React from "react";
import { useTranslation } from "react-i18next";
import { languageCookie, supportedLanguages } from "../../common/i18n";

/**
 * Switches the language in place and remembers the choice in a cookie,
 * so the server renders the next page load in the same language.
 */
export const LanguageSwitch = () => {
  const { t, i18n } = useTranslation();

  const change = (lng: string) => {
    document.cookie = `${languageCookie}=${lng}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = lng;
    void i18n.changeLanguage(lng);
  };

  return (
    <div className="lang-switch" role="group" aria-label={t("nav.language")}>
      {supportedLanguages.map((lng) => (
        <button
          key={lng}
          type="button"
          lang={lng}
          aria-pressed={i18n.language === lng}
          onClick={() => change(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
