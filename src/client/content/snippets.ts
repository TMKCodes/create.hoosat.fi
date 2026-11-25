/**
 * Code samples shown on the site. They are copied from this repository's own source,
 * so keep them in sync when you change the files they come from.
 */

export const serverSnippet = `
import { createRouter, createServer, listen } from './core/server';
import { assets } from './core/assets';
import { renderer } from './core/renderer';

const router = createRouter();

// Middlewares run in order, before any route.
router.Middleware(seoFiles());
router.Middleware(assets(publicDir));

// API routes answer directly.
router.UseRouter(APIRouter);

// Every other GET request is a React page.
router.Get("*", async (req, res) => {
  const lng = pickLanguage(req.headers.cookie, req.headers['accept-language']);
  if (isNotFound(req.url)) res.status(404);
  renderer({ res, jsx: <Document url={req.url} lng={lng} />, publicDir });
});

listen(createServer(router), 8181, () => console.log("Ready"));
`;

export const terminalSnippet = `
$ npx hoosat-create@latest
Creating a new project from Hoosat React SSR Template.
Enter destination project name: my-site
Do you want to initialize a git repository? [Y/n] y
Project cloned successfully.
Project template dependencies installed with npm.
$ cd my-site && npm run dev
Server is running on port 8181
`;

export const prereqSnippet = `
$ node --version
v24.22.3
$ git --version
git version 2.55.0
`;

export const createSnippet = `
$ npx hoosat-create@latest
# or answer the questions up front:
$ npx hoosat-create@latest --destination my-site --author "Your Name" --license MIT --gitInit Y
`;

export const devSnippet = `
$ cd my-site
$ npm run dev
Server is running on port 8181
`;

export const layoutSnippet = `
my-site/
├── public/                 static files, copied into the build
├── src/
│   ├── client/             React app: App.tsx, routes/, components/, *.css
│   ├── common/             code shared by server and client
│   ├── server/
│   │   ├── api-routes/     your API endpoints
│   │   ├── core/           hoosat-server-core (git submodule)
│   │   └── index.tsx       the server itself
│   └── __tests__/          Jest tests
├── build-tools/            TypeScript build helpers run by Node
├── webpack.client.config.js
└── webpack.server.config.js
`;

export const pageSnippet = `
// src/client/routes/Pricing.tsx
import { Helmet } from "react-helmet-async";

export const Pricing = () => (
  <section>
    <Helmet>
      <title>Pricing</title>
      <meta name="description" content="Plans for every team." />
    </Helmet>
    <h1>Pricing</h1>
  </section>
);
`;

export const routesSnippet = `
// src/client/App.tsx
export const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  { path: "/tutorial", element: <Tutorial /> },
  { path: "/pricing", element: <Pricing /> },
  { path: "*", element: <NotFound /> },
];
`;

export const apiSnippet = `
// src/server/api-routes/hello/hello.ts
import { createRouter } from "../../core/server";

export const helloRouter = createRouter();

helloRouter.Get("/api/hello/:name", (req, res) => {
  res.status(200).json({ message: "Hello, " + req.params!["name"] });
});

// src/server/api-routes/index.ts
APIRouter.UseRouter(helloRouter);
`;

export const seoSnippet = `
// src/client/components/Seo.tsx (shortened)
export const Seo = ({ title, description, path }: SeoProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={absoluteUrl(path)} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
  </Helmet>
);
`;

export const styleSnippet = `
/* src/client/styles/00-tokens.css (shortened) */
:root {
  --bg: #f7f8fb;
  --text: #0e1525;
  --accent: #0b7a6e;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a0d14;
    --text: #e8ecf3;
    --accent: #34d3bf;
  }
}
`;

export const i18nSnippet = `
// src/server/index.tsx: choose the language for this request
const lng = pickLanguage(req.headers.cookie, req.headers['accept-language']);
renderer({ res, jsx: <Document url={url} lng={lng} />, publicDir });

// src/client/index.tsx: hydrate with the language the server used
const i18n = createI18n(document.documentElement.lang);
`;

export const testSnippet = `
$ npm test
Tests:       19 passed, 19 total
$ npm run typecheck
`;

export const deploySnippet = `
$ npm run build
$ npm start
Server is running on port 8181
`;

export const dockerSnippet = `
$ docker build -t create-hoosat-fi .
$ docker run -d -p 3070:3070 --restart unless-stopped create-hoosat-fi
`;
