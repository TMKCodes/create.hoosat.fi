import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Seo } from "../components/Seo";
import { CopyCommand } from "../components/CopyCommand";
import { CodeBlock } from "../components/CodeBlock";
import { PingDemo } from "../components/PingDemo";
import { ArrowRightIcon, GitHubIcon } from "../components/Icons";
import { site } from "../../common/site";
import { serverSnippet, terminalSnippet } from "../content/snippets";

const proofKeys = ["command", "express", "compression", "typescript"] as const;
const featureKeys = ["ssr", "router", "seo", "compression", "typescript", "i18n", "security", "testing", "ui"] as const;
const flowKeys = ["request", "middleware", "route", "render", "head", "hydrate"] as const;
const stack = [
  ["React", "19"],
  ["React Router", "8"],
  ["TypeScript", "6"],
  ["react-helmet-async", "3"],
  ["i18next", "27"],
  ["Webpack", "5"],
  ["Jest", "30"],
  ["Node.js", "22 · 24 · 26"],
] as const;

/** Small glyphs for the feature cards, drawn with the same stroke style as the icons. */
const featureGlyphs: Record<(typeof featureKeys)[number], string> = {
  ssr: "M4 6h16M4 12h10M4 18h6",
  router: "M6 4v16M18 4v6a4 4 0 0 1-4 4H6",
  seo: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  compression: "M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5",
  typescript: "M4 4h16v16H4zM8 10h5M10.5 10v7M15 13.5c0-1 2-1.5 2 0s-2 1-2 2.5 2 1 2 0",
  i18n: "M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
  security: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  testing: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3",
  ui: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
};

export const Home = () => {
  const { t } = useTranslation();
  return (
    <>
      <Seo
        title={t("meta.homeTitle")}
        description={t("meta.homeDescription")}
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareSourceCode",
          name: site.name,
          description: t("meta.homeDescription"),
          url: site.url,
          codeRepository: site.links.cli,
          programmingLanguage: ["TypeScript", "React"],
          runtimePlatform: "Node.js",
          license: "https://opensource.org/licenses/MIT",
          author: { "@type": "Organization", name: "Hoosat Oy", url: site.links.company },
        }}
      />

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">{t("hero.eyebrow")}</p>
            <h1>
              {t("hero.titleStart")} <span className="gradient-text">{t("hero.titleAccent")}</span>
            </h1>
            <p className="lead">{t("hero.lead")}</p>
            <CopyCommand />
            <div className="actions">
              <Link to="/tutorial" className="button button-primary">
                {t("hero.primary")} <ArrowRightIcon />
              </Link>
              <a href={site.links.cli} className="button button-ghost">
                <GitHubIcon /> {t("hero.secondary")}
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <CodeBlock code={terminalSnippet} language="shell" label="Terminal" />
          </div>
        </div>
        <div className="container">
          <ul className="proof">
            {proofKeys.map((key) => (
              <li key={key}>
                <strong>{t(`proof.${key}.value`)}</strong>
                <span>{t(`proof.${key}.label`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <header className="section-header">
            <h2>{t("features.title")}</h2>
            <p>{t("features.lead")}</p>
          </header>
          <ul className="feature-grid">
            {featureKeys.map((key) => (
              <li key={key} className="card">
                <svg className="card-glyph" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d={featureGlyphs[key]} />
                </svg>
                <h3>{t(`features.${key}.title`)}</h3>
                <p>{t(`features.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="section section-alt">
        <div className="container">
          <header className="section-header">
            <h2>{t("flow.title")}</h2>
            <p>{t("flow.lead")}</p>
          </header>
          <ol className="flow">
            {flowKeys.map((key, index) => (
              <li key={key}>
                <span className="flow-step" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{t(`flow.${key}.title`)}</h3>
                <p>{t(`flow.${key}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <h2>{t("code.title")}</h2>
            <p className="section-lead">{t("code.lead")}</p>
            <h3 className="stack-title">{t("stack.title")}</h3>
            <p className="muted">{t("stack.lead")}</p>
            <ul className="stack">
              {stack.map(([name, version]) => (
                <li key={name}><span>{name}</span><strong>{version}</strong></li>
              ))}
            </ul>
          </div>
          <CodeBlock code={serverSnippet} label={t("code.fileLabel")} />
        </div>
      </section>

      <section className="section section-alt">
        <div className="container demo">
          <div>
            <h2>{t("demo.title")}</h2>
            <p className="section-lead">{t("demo.lead")}</p>
          </div>
          <PingDemo />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta">
            <h2>{t("cta.title")}</h2>
            <p>{t("cta.lead")}</p>
            <CopyCommand />
            <div className="actions actions-center">
              <Link to="/tutorial" className="button button-primary">
                {t("cta.primary")} <ArrowRightIcon />
              </Link>
              <a href={site.links.source} className="button button-ghost">
                <GitHubIcon /> {t("cta.secondary")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
