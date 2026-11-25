/**
 * Site wide constants shared by the server and the client.
 * Keep URLs here so links, canonical tags and the sitemap never disagree.
 */
export const site = {
  name: "Hoosat Create",
  url: "https://create.hoosat.fi",
  command: "npx hoosat-create@latest",
  links: {
    source: "https://github.com/TMKCodes/create.hoosat.fi",
    cli: "https://github.com/TMKCodes/hoosat-create",
    template: "https://github.com/TMKCodes/hoosat-template",
    serverCore: "https://github.com/TMKCodes/hoosat-server-core",
    npm: "https://www.npmjs.com/package/hoosat-create",
    company: "https://hoosat.fi",
  },
} as const;

/**
 * Pages that are listed in sitemap.xml. Add new public pages here as well as in App.tsx.
 */
export const sitemapPages: { path: string; changefreq: "weekly" | "monthly"; priority: number }[] = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/tutorial", changefreq: "monthly", priority: 0.8 },
];

/**
 * Builds an absolute URL on the public site for canonical and Open Graph tags.
 */
export const absoluteUrl = (path: string): string => new URL(path, site.url).toString();
