import { useEffect, useState } from "react";

/** Performance mark set when React has hydrated the server HTML (see App.tsx). */
export const hydratedMark = "hoosat:hydrated";

/** Must match serverTimingMetric in src/server/timing.ts. */
const serverMetric = "hoosat";

/** Timings of the page load that opened this tab, in milliseconds from navigation start. */
export type PageSpeed = {
  /** Server time from routing to the first byte, from the Server-Timing header. */
  server?: number;
  /** Time to the first byte of the HTML. */
  firstByte?: number;
  /** First contentful paint. */
  firstPaint?: number;
  /** React finished hydrating, the page is interactive. */
  interactive?: number;
  /** The load event finished. */
  loaded?: number;
};

/**
 * Reads the timings from the browser's Navigation Timing, Paint Timing and User Timing APIs.
 * They describe the initial page load: client side navigation afterwards does not hit the server.
 */
export const readPageSpeed = (): PageSpeed => {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") {
    return {};
  }
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const positive = (value: number | undefined) => (value !== undefined && value > 0 ? value : undefined);
  return {
    server: navigation?.serverTiming?.find((entry) => entry.name === serverMetric)?.duration,
    firstByte: positive(navigation?.responseStart),
    firstPaint: positive(performance.getEntriesByName("first-contentful-paint")[0]?.startTime),
    interactive: positive(performance.getEntriesByName(hydratedMark)[0]?.startTime),
    loaded: positive(navigation?.loadEventEnd),
  };
};

/**
 * The page speed, or null on the server and during hydration, so the first client render
 * matches the server HTML. Updates once hydration has finished and again after the load event.
 */
export const usePageSpeed = (): PageSpeed | null => {
  const [speed, setSpeed] = useState<PageSpeed | null>(null);
  useEffect(() => {
    const update = () => setSpeed(readPageSpeed());
    // App marks hydration in its own effect, which runs right after this one.
    const timer = setTimeout(update, 0);
    const onLoad = () => setTimeout(update, 0);
    if (document.readyState !== "complete") {
      window.addEventListener("load", onLoad, { once: true });
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", onLoad);
    };
  }, []);
  return speed;
};

/**
 * Formats milliseconds with precision that fits the size: 0.42, 3.1, 264.
 */
export const formatMs = (value: number, language: string): string => {
  const digits = value < 1 ? 2 : value < 10 ? 1 : 0;
  return new Intl.NumberFormat(language, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
};

/**
 * Reads the server duration from a Server-Timing header value, e.g. for fetch responses.
 */
export const parseServerTiming = (header: string | null): number | undefined => {
  const match = header?.match(new RegExp(`(?:^|,)\\s*${serverMetric}\\b[^,]*?dur=([0-9.]+)`));
  return match ? Number(match[1]) : undefined;
};
