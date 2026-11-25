import React from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { I18nextProvider } from "react-i18next";
import App from "./App";
import { createI18n } from "../common/i18n";

const domNode = document.getElementById("root");

if (domNode === null) {
  console.error("Could not find element with root id.");
} else {
  // The server wrote the language it rendered with into <html lang>. Using the same one here
  // makes the first client render identical to the server HTML, which is what hydration needs.
  const i18n = createI18n(document.documentElement.lang);
  hydrateRoot(
    domNode,
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <HelmetProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </HelmetProvider>
      </I18nextProvider>
    </React.StrictMode>
  );
}
