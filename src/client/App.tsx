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
 * The first render is skipped so the browser's own scroll restoration keeps working on page load.
 */
const useScrollOnNavigate = () => {
  const { pathname, hash } = useLocation();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) {
      target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
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
