import React, { useEffect, useRef } from "react";
import { RouteObject, useLocation, useRoutes } from "react-router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./routes/Home";
import { Tutorial } from "./routes/Tutorial";
import { NotFound } from "./routes/NotFound";
import { hydratedMark } from "./performance";

/**
 * The route list is shared by the browser router and the server.
 * The server uses it to send a 404 status when only the "*" route matches.
 * Remember to list new public pages in src/common/site.ts for the sitemap as well.
 */
export const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  { path: "/tutorial", element: <Tutorial /> },
  { path: "*", element: <NotFound /> },
];

/**
 * Scrolls to the top (or to the #hash target) after client side navigation.
 * It only acts when the location really changed, so it never runs on page load (where the browser's
 * own scroll restoration should win), not even when StrictMode runs effects twice in development.
 * Scrolling makes the browser compute layout, so doing it on load would be a forced reflow.
 */
const useScrollOnNavigate = () => {
  const { pathname, hash } = useLocation();
  const location = `${pathname}${hash}`;
  const previous = useRef(location);
  useEffect(() => {
    if (previous.current === location) {
      return;
    }
    previous.current = location;
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) {
      target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [location, pathname, hash]);
};

/**
 * Marks the moment React has hydrated the server HTML. Effects only run in the browser,
 * after the first commit, so this is when the page became interactive.
 */
const useHydratedMark = () => {
  useEffect(() => {
    if (performance.getEntriesByName(hydratedMark).length === 0) {
      performance.mark(hydratedMark);
    }
  }, []);
};

export default function App() {
  const page = useRoutes(routes);
  useScrollOnNavigate();
  useHydratedMark();
  return (
    <>
      <Header />
      <main id="content">{page}</main>
      <Footer />
    </>
  );
}
