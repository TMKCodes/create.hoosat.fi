import { HoosatRequestHandler } from "./core/types";

/** Name of the metric in the Server-Timing header. The client reads it from the same name. */
export const serverTimingMetric = "hoosat";

/**
 * Middleware that adds a standard `Server-Timing` header to every response:
 * the time from routing the request to sending its first byte. For pages that is the
 * server side render up to the first streamed HTML chunk.
 *
 * Browsers show the header in DevTools (Network > Timing) and expose it to the page through
 * `performance.getEntriesByType("navigation")[0].serverTiming`, which the speed panel reads.
 * Register it first so it measures everything after it.
 */
export const serverTiming = (): HoosatRequestHandler => (req, res, next) => {
  const started = process.hrtime.bigint();
  const writeHead = res.writeHead.bind(res) as (...args: unknown[]) => typeof res;
  // Node calls writeHead right before the headers go out, also for implicit headers on the first write.
  res.writeHead = ((...args: unknown[]) => {
    if (!res.headersSent && !res.hasHeader("Server-Timing")) {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      res.setHeader("Server-Timing", `${serverTimingMetric};desc="Hoosat server";dur=${ms.toFixed(2)}`);
    }
    return writeHead(...args);
  }) as typeof res.writeHead;
  next && next(req, res);
};
