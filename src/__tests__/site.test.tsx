import React from 'react';
import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { createI18n, pickLanguage } from '../common/i18n';
import { absoluteUrl, sitemapPages } from '../common/site';
import { buildRobotsTxt, buildSitemapXml } from '../server/seo-files';
import { Document, isNotFound } from '../server/render';
import en from '../common/locales/en.json' with { type: "json" };
import fi from '../common/locales/fi.json' with { type: "json" };

/** Lists every leaf key of a nested translation object, e.g. "hero.title". */
const keysOf = (value: object, prefix = ''): string[] =>
  Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' && child !== null ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

const render = (url: string, lng: 'en' | 'fi') =>
  renderToString(
    <HelmetProvider context={{}}>
      <Document url={url} lng={lng} />
    </HelmetProvider>
  );

describe('pickLanguage', () => {
  it('defaults to English', () => {
    expect(pickLanguage()).toBe('en');
    expect(pickLanguage('', 'de-DE,de;q=0.9')).toBe('en');
  });

  it('uses Accept-Language when there is no cookie', () => {
    expect(pickLanguage(undefined, 'fi-FI,fi;q=0.9,en;q=0.8')).toBe('fi');
    expect(pickLanguage(undefined, 'sv;q=0.9,fi;q=0.5,en;q=0.7')).toBe('en');
  });

  it('lets the cookie win over the header', () => {
    expect(pickLanguage('theme=dark; lng=fi', 'en-US')).toBe('fi');
    expect(pickLanguage('lng=en', 'fi-FI')).toBe('en');
  });

  it('ignores unsupported cookie values', () => {
    expect(pickLanguage('lng=xx', 'fi')).toBe('fi');
  });
});

describe('translations', () => {
  it('have the same keys in English and Finnish', () => {
    expect(keysOf(fi).sort()).toEqual(keysOf(en).sort());
  });

  it('have no empty strings', () => {
    for (const [name, messages] of Object.entries({ en, fi })) {
      for (const key of keysOf(messages)) {
        const value = key.split('.').reduce<any>((node, part) => node[part], messages);
        expect(`${name}:${key}:${String(value).trim() === '' ? 'empty' : 'ok'}`).toBe(`${name}:${key}:ok`);
      }
    }
  });

  it('initialise synchronously, so the first render is already translated', () => {
    expect(createI18n('fi').t('nav.tutorial')).toBe('Opas');
    expect(createI18n('en').t('nav.tutorial')).toBe('Tutorial');
    expect(createI18n('unknown').language).toBe('en');
  });
});

describe('robots.txt and sitemap.xml', () => {
  it('point to the public site with absolute URLs', () => {
    expect(buildRobotsTxt()).toContain('Sitemap: https://create.hoosat.fi/sitemap.xml');
    const xml = buildSitemapXml('2026-11-25');
    for (const page of sitemapPages) {
      expect(xml).toContain(`<loc>${absoluteUrl(page.path)}</loc>`);
    }
    expect(xml).toContain('<lastmod>2026-11-25</lastmod>');
  });
});

describe('server rendering', () => {
  it('detects unknown pages for the 404 status', () => {
    expect(isNotFound('/')).toBe(false);
    expect(isNotFound('/tutorial')).toBe(false);
    expect(isNotFound('/tutorial?ref=github')).toBe(false);
    expect(isNotFound('/does-not-exist')).toBe(true);
  });

  it('renders the home page in English', () => {
    const html = render('/', 'en');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('without the framework.');
    expect(html).toContain('npx hoosat-create@latest');
  });

  it('renders the tutorial in Finnish', () => {
    const html = render('/tutorial', 'fi');
    expect(html).toContain('<html lang="fi">');
    expect(html).toContain('Rakenna ja julkaise sivusto Hoosat Createllä');
    expect(html).toContain('id="deploy"');
  });

  it('renders the not found page for unknown URLs', () => {
    expect(render('/nope', 'en')).toContain('Page not found');
  });
});
