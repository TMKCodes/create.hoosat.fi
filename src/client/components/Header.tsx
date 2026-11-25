import React from "react";
import { Link, NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { site } from "../../common/site";
import { GitHubIcon, Logo } from "./Icons";
import { LanguageSwitch } from "./LanguageSwitch";

export const Header = () => {
  const { t } = useTranslation();
  return (
    <header className="site-header">
      <a className="skip-link" href="#content">{t("nav.skip")}</a>
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label={t("nav.home")}>
          <Logo />
          <span>Hoosat <strong>Create</strong></span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <a href="/#features" className="nav-optional">{t("nav.features")}</a>
          <a href="/#how-it-works" className="nav-optional">{t("nav.howItWorks")}</a>
          <NavLink to="/tutorial">{t("nav.tutorial")}</NavLink>
          <a href={site.links.cli} className="nav-icon" aria-label={t("nav.github")} title={t("nav.github")}>
            <GitHubIcon size={20} />
          </a>
          <LanguageSwitch />
        </nav>
      </div>
    </header>
  );
};
