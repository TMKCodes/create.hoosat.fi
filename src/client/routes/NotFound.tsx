import React from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Seo } from "../components/Seo";
import { ArrowRightIcon } from "../components/Icons";

export const NotFound = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <section className="page-hero not-found">
      <Seo title={t("meta.notFoundTitle")} description={t("notFound.body")} path={pathname} noindex />
      <div className="container">
        <p className="eyebrow">{t("notFound.eyebrow")}</p>
        <h1>{t("notFound.title")}</h1>
        <p className="lead">{t("notFound.body")}</p>
        <p><code>{pathname}</code></p>
        <Link to="/" className="button button-primary">
          {t("notFound.home")} <ArrowRightIcon />
        </Link>
      </div>
    </section>
  );
};
