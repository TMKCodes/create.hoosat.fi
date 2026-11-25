import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Seo } from "../components/Seo";
import { CodeBlock } from "../components/CodeBlock";
import { Rich } from "../components/Rich";
import { GitHubIcon } from "../components/Icons";
import { site } from "../../common/site";
import * as snippets from "../content/snippets";

type Step = {
  id: string;
  /** Content between and after the translated paragraphs. */
  blocks: (p: (key: string) => ReactNode) => ReactNode;
};

const steps: Step[] = [
  { id: "prereq", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.prereqSnippet} language="shell" />{p("p2")}</> },
  { id: "create", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.createSnippet} language="shell" />{p("p2")}</> },
  { id: "dev", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.devSnippet} language="shell" />{p("p2")}</> },
  { id: "layout", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.layoutSnippet} language="text" />{p("p2")}</> },
  {
    id: "page",
    blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.pageSnippet} />{p("p2")}<CodeBlock code={snippets.routesSnippet} /></>,
  },
  { id: "api", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.apiSnippet} />{p("p2")}</> },
  { id: "seo", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.seoSnippet} />{p("p2")}</> },
  { id: "style", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.styleSnippet} language="text" />{p("p2")}</> },
  { id: "i18n", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.i18nSnippet} />{p("p2")}</> },
  { id: "test", blocks: (p) => <>{p("p1")}<CodeBlock code={snippets.testSnippet} language="shell" />{p("p2")}</> },
  {
    id: "deploy",
    blocks: (p) => (
      <>
        {p("p1")}
        <CodeBlock code={snippets.deploySnippet} language="shell" />
        {p("p2")}
        <CodeBlock code={snippets.dockerSnippet} language="shell" />
        {p("p3")}
      </>
    ),
  },
];

export const Tutorial = () => {
  const { t } = useTranslation();
  return (
    <>
      <Seo
        title={t("meta.tutorialTitle")}
        description={t("meta.tutorialDescription")}
        path="/tutorial"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: t("tutorial.title"),
          description: t("meta.tutorialDescription"),
          step: steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: t(`tutorial.${step.id}.title`),
            url: `${site.url}/tutorial#${step.id}`,
          })),
        }}
      />
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">{t("tutorial.eyebrow")}</p>
          <h1>{t("tutorial.title")}</h1>
          <p className="lead">{t("tutorial.lead")}</p>
          <a href={site.links.source} className="button button-ghost">
            <GitHubIcon /> {t("tutorial.source")}
          </a>
        </div>
      </section>
      <div className="container tutorial">
        <aside className="toc">
          <nav aria-labelledby="toc-title">
            <h2 id="toc-title">{t("tutorial.toc")}</h2>
            <ol>
              {steps.map((step) => (
                <li key={step.id}><a href={`#${step.id}`}>{t(`tutorial.${step.id}.title`)}</a></li>
              ))}
            </ol>
          </nav>
        </aside>
        <article className="steps">
          {steps.map((step, index) => (
            <section key={step.id} id={step.id} className="step" aria-labelledby={`${step.id}-title`}>
              <h2 id={`${step.id}-title`}>
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                {t(`tutorial.${step.id}.title`)}
              </h2>
              {step.blocks((key) => <p><Rich text={t(`tutorial.${step.id}.${key}`)} /></p>)}
            </section>
          ))}
        </article>
      </div>
    </>
  );
};
