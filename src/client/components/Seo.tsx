import React from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { absoluteUrl, site } from "../../common/site";

type SeoProps = {
  title: string;
  description: string;
  /** Path of the page, used for the canonical URL. */
  path: string;
  noindex?: boolean;
  /** Optional structured data, see https://schema.org */
  jsonLd?: Record<string, unknown>;
};

/**
 * All head tags of a page in one place. On the server the core renderer streams these into <head>,
 * so crawlers and link previews get them without running JavaScript.
 */
export const Seo = ({ title, description, path, noindex = false, jsonLd }: SeoProps) => {
  const { i18n } = useTranslation();
  const url = absoluteUrl(path);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={url} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={i18n.language === "fi" ? "fi_FI" : "en_US"} />
      <meta name="twitter:card" content="summary" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};
