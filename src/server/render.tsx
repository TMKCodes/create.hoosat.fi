import React from "react";
import { matchRoutes } from "react-router";
import { StaticRouter } from "react-router";
import { I18nextProvider } from "react-i18next";
import App, { routes } from "../client/App";
import { createI18n, Language } from "../common/i18n";

/**
 * True when the URL is only matched by the catch-all "*" route, i.e. the page does not exist.
 */
export const isNotFound = (url: string): boolean => {
  const matches = matchRoutes(routes, url.split("?")[0]);
  return !matches || matches.some((match) => match.route.path === "*");
};

/**
 * Hides controls that need JavaScript (class "js-only") when scripting is off, so nothing on the page
 * looks clickable without working. Added to <head> through the renderer's headTags.
 */
export const noScriptStyles = "<noscript><style>.js-only{display:none!important}</style></noscript>";

/**
 * The full HTML document for one request. The bundles, styles and Helmet tags are added to <head>
 * by the core renderer while the document streams out.
 */
export const Document = ({ url, lng }: { url: string; lng: Language }) => (
  <I18nextProvider i18n={createI18n(lng)}>
    <html lang={lng}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0d14" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f7f8fb" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        {/* No <link rel="manifest">: the site is not an installable app, and the browser would fetch the
            manifest right after the HTML, adding a request to the critical chain. theme-color covers the UI. */}
      </head>
      <body>
        <div id="root">
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </div>
      </body>
    </html>
  </I18nextProvider>
);
