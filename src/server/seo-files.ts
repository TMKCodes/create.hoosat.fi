import { HoosatRequestHandler } from "./core/types";
import { absoluteUrl, sitemapPages } from "../common/site";

/**
 * Builds robots.txt with an absolute sitemap URL.
 */
export const buildRobotsTxt = (): string =>
  ["User-agent: *", "Allow: /", "Disallow: /api/", `Sitemap: ${absoluteUrl("/sitemap.xml")}`, ""].join("\n");

/**
 * Builds a sitemap.xml from the page list in src/common/site.ts.
 */
export const buildSitemapXml = (lastmod: string = new Date().toISOString().slice(0, 10)): string => {
  const urls = sitemapPages
    .map(
      (page) =>
        `  <url>\n    <loc>${absoluteUrl(page.path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority.toFixed(1)}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

// The site only changes on deploy, so the build date is a good lastmod.
const startedOn = new Date().toISOString().slice(0, 10);

/**
 * Middleware that answers /robots.txt and /sitemap.xml with generated files.
 * Register it before the assets middleware so it wins over any file of the same name in public/.
 */
export const seoFiles = (): HoosatRequestHandler => (req, res, next) => {
  const path = (req.url ?? "").split("?")[0];
  if (req.method === "GET" && path === "/robots.txt") {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(buildRobotsTxt());
    return;
  }
  if (req.method === "GET" && path === "/sitemap.xml") {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(buildSitemapXml(startedOn));
    return;
  }
  next && next(req, res);
};
