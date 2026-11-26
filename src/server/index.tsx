import dotenv from 'dotenv';
import { createRouter, createServer, listen } from './core/server';
import { assets } from './core/assets';
import { renderer } from './core/renderer';
import { DEBUG } from './core/errors';
import { writeNonceToFile } from './core/nonce';
import { APIRouter } from './api-routes';
import { seoFiles } from './seo-files';
import { serverTiming } from './timing';
import { Document, isNotFound, noScriptStyles } from './render';
import { languageRedirect, pickLanguage } from '../common/i18n';
import { dependencyCheckOptionsFromEnv, runDependencyCheck, startDependencyCheck } from './dependency-check';

dotenv.config();

const isDevelopment = process.argv[2] === "development";
const publicDir = isDevelopment ? "./build-dev/public" : "./build/public";

/**
 * `node build/server.js --check-dependencies` checks the stack's dependencies once, emails every
 * pending update and exits, without starting the server. Handy for testing the SMTP settings:
 *   docker exec create-hoosat-fi node build/server.js --check-dependencies
 */
if (process.argv.includes("--check-dependencies")) {
  try {
    await runDependencyCheck({ ...dependencyCheckOptionsFromEnv(process.env), force: true });
    process.exit(0);
  } catch (error) {
    console.error(`[dependency-check] ${(error as Error).message}`);
    process.exit(1);
  }
}

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
  // The EN/FI links work without JavaScript: remember the choice and redirect to the clean URL.
  const redirect = languageRedirect(url);
  if (redirect) {
    if (redirect.cookie) {
      res.setHeader('Set-Cookie', redirect.cookie);
    }
    res.setHeader('Location', redirect.location);
    res.setHeader('Cache-Control', 'no-store');
    res.status(303).end();
    return;
  }
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
    headTags: { title: "", meta: "", link: "", script: "", base: "", style: noScriptStyles },
    // Inline styles.css into <head>: no render-blocking stylesheet request before the first paint.
    inlineStyles: true,
    // Stream the HTML compressed with Brotli or gzip, whichever the browser accepts.
    acceptEncoding: req.headers['accept-encoding'],
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

// Daily dependency update check with an email when the stack needs an update (see README, "Dependency updates").
// Off in development so restarts do not send mail; DEPENDENCY_CHECK=off turns it off in production too.
if (!isDevelopment && process.env.DEPENDENCY_CHECK !== "off") {
  startDependencyCheck(dependencyCheckOptionsFromEnv(process.env));
}
