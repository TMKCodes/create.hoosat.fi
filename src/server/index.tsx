import dotenv from 'dotenv';
import { createRouter, createServer, listen } from './core/server';
import { assets } from './core/assets';
import { renderer } from './core/renderer';
import { DEBUG } from './core/errors';
import { writeNonceToFile } from './core/nonce';
import { APIRouter } from './api-routes';
import { seoFiles } from './seo-files';
import { serverTiming } from './timing';
import { Document, isNotFound } from './render';
import { pickLanguage } from '../common/i18n';

dotenv.config();

const isDevelopment = process.argv[2] === "development";
const publicDir = isDevelopment ? "./build-dev/public" : "./build/public";

writeNonceToFile();

// Create a router
const router = createRouter();

/**
 * Middlewares run in the order they are registered, before any route.
 * 1. Server-Timing header on every response, so the site can show how fast it rendered.
 * 2. robots.txt and sitemap.xml are generated from src/common/site.ts.
 * 3. Static files are served from the public directory, precompressed when the browser allows it.
 *
 * The template also registers `cors()` and `upload()`. This site only serves same-origin pages and
 * accepts no files, so both are left out on purpose.
 */
router.Middleware(serverTiming());
router.Middleware(seoFiles());
router.Middleware(assets(publicDir));

// API routes: /api/ping, /api/ping/:id and /api/health.
router.UseRouter(APIRouter);
DEBUG.log("APIRouter added.");

/**
 * Every other GET request is a page: pick the language, render React and stream the HTML.
 */
router.Get("*", async (req, res) => {
  const url = req.url ?? "/";
  const lng = pickLanguage(req.headers.cookie, req.headers['accept-language']);
  if (isNotFound(url)) {
    // Unknown URLs still render the friendly 404 page, but with a status search engines understand.
    res.status(404);
  }
  res.setHeader('Content-Language', lng);
  res.setHeader('Vary', 'Cookie, Accept-Language');
  renderer({
    res,
    jsx: <Document url={url} lng={lng} />,
    publicDir,
    // Pass every field: the core renderer concatenates them and a missing one would print "NaN".
    headTags: { title: "", meta: "", link: "", script: "", base: "", style: "" },
  });
});

// Create the server. Set PROTOCOL="HTTPS" with HTTPS_KEY and HTTPS_CERT to terminate TLS here.
const server = createServer(router, {
  protocol: process.env.PROTOCOL || "HTTP",
  https: { key: process.env.HTTPS_KEY, cert: process.env.HTTPS_CERT },
});

const port = parseInt(process.env.PORT || "8181");
listen(server, port, () => {
  console.log(`Server is running on port ${port}`);
});
