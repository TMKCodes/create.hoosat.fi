import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { site } from "../../common/site";
import { Logo } from "./Icons";
import { SpeedBadge } from "./SpeedPanel";

export const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand" aria-label={t("nav.home")}>
            <Logo size={24} />
            <span>Hoosat <strong>Create</strong></span>
          </Link>
          <p>{t("footer.tagline")}</p>
          <SpeedBadge />
          <p className="footer-small">© {new Date().getFullYear()} <a href={site.links.company}>{t("footer.company")}</a>. {t("footer.license")}</p>
        </div>
        <nav aria-label={t("footer.project")}>
          <h2>{t("footer.project")}</h2>
          <ul>
            <li><Link to="/tutorial">{t("nav.tutorial")}</Link></li>
            <li><a href={site.links.source}>{t("footer.source")}</a></li>
            <li><a href={site.links.cli}>{t("footer.cli")}</a></li>
            <li><a href={site.links.template}>{t("footer.template")}</a></li>
            <li><a href={site.links.serverCore}>{t("footer.core")}</a></li>
          </ul>
        </nav>
        <nav aria-label={t("footer.community")}>
          <h2>{t("footer.community")}</h2>
          <ul>
            <li><a href={site.links.npm}>{t("footer.npm")}</a></li>
            <li><a href={site.links.discord}>{t("footer.discord")}</a></li>
            <li><a href={site.links.company}>{t("footer.company")}</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};
