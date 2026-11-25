import React from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { languageCookie, languageCookieValue, supportedLanguages } from "../../common/i18n";

/**
 * The EN/FI switch. Each option is a real link (`?lng=fi`): without JavaScript the server remembers the
 * choice in a cookie and redirects back to the page. With JavaScript the language changes in place and
 * the cookie is written here, so the next page load is rendered in the same language.
 */
export const LanguageSwitch = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  const change = (event: React.MouseEvent<HTMLAnchorElement>, lng: (typeof supportedLanguages)[number]) => {
    event.preventDefault();
    document.cookie = languageCookieValue(lng);
    document.documentElement.lang = lng;
    void i18n.changeLanguage(lng);
  };

  return (
    <div className="lang-switch" role="group" aria-label={t("nav.language")}>
      {supportedLanguages.map((lng) => (
        <a
          key={lng}
          href={`${pathname}?${languageCookie}=${lng}`}
          hrefLang={lng}
          lang={lng}
          rel="nofollow"
          aria-current={i18n.language === lng ? "true" : undefined}
          onClick={(event) => change(event, lng)}
        >
          {lng.toUpperCase()}
        </a>
      ))}
    </div>
  );
};
