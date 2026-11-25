import React from 'react';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { createRouter, createServer } from '../server/core/server';
import { writeNonceToFile } from '../server/core/nonce';
import { pickEncoding, renderer } from '../server/core/renderer';
import { Document } from '../server/render';

type Reply = { status: number; headers: http.IncomingHttpHeaders; html: string };

const decode = (body: Buffer, encoding?: string): string =>
  (encoding === 'br' ? zlib.brotliDecompressSync(body) : encoding === 'gzip' ? zlib.gunzipSync(body) : body).toString('utf-8');

describe('core renderer options used by the site', () => {
  let publicDir: string;
  let server: ReturnType<typeof createServer>;
  let port: number;

  const get = (url: string, acceptEncoding?: string) =>
    new Promise<Reply>((resolve, reject) => {
      const headers = acceptEncoding !== undefined ? { 'Accept-Encoding': acceptEncoding } : undefined;
      http.get({ host: '127.0.0.1', port, path: url, headers }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          html: decode(Buffer.concat(chunks), res.headers['content-encoding']),
        }));
      }).on('error', reject);
    });

  beforeAll(async () => {
    writeNonceToFile();
    publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoosat-renderer-'));
    fs.writeFileSync(path.join(publicDir, 'styles.css'), 'body{color:#123456}');
    fs.writeFileSync(path.join(publicDir, 'bundle.test.js'), 'export {};');
    const router = createRouter();
    router.Get('*', (req, res) => {
      res.setHeader('Vary', 'Cookie');
      renderer({
        res,
        jsx: <Document url={req.url ?? '/'} lng="en" />,
        publicDir,
        headTags: { title: '', meta: '', link: '', script: '', base: '', style: '' },
        inlineStyles: true,
        acceptEncoding: req.headers['accept-encoding'],
      });
    });
    server = createServer(router);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    port = (server!.address() as { port: number }).port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server!.close(resolve));
    fs.rmSync(publicDir, { recursive: true, force: true });
  });

  it('inlines styles.css instead of a render-blocking stylesheet link', async () => {
    const { html } = await get('/', 'br');
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toMatch(/<style nonce="[^"]+">body\{color:#123456\}<\/style>/);
    expect(html).not.toContain('styles.css');
    expect(head).toContain('<script type="module" src="/bundle.test.js" async></script>');
  });

  it('streams Brotli when the browser accepts it', async () => {
    const reply = await get('/', 'gzip, deflate, br');
    expect(reply.headers['content-encoding']).toBe('br');
    expect(reply.headers['vary']).toBe('Cookie, Accept-Encoding');
    expect(reply.html).toContain('without the framework.');
    expect(reply.html.trimEnd().endsWith('</html>')).toBe(true);
  });

  it('falls back to gzip, and to plain HTML', async () => {
    expect((await get('/', 'gzip')).headers['content-encoding']).toBe('gzip');
    const plain = await get('/', 'identity');
    expect(plain.headers['content-encoding']).toBeUndefined();
    expect(plain.html).toContain('without the framework.');
  });

  it('picks the encoding from Accept-Encoding', () => {
    expect(pickEncoding('gzip, deflate, br, zstd')).toBe('br');
    expect(pickEncoding('br;q=0, gzip')).toBe('gzip');
    expect(pickEncoding('*')).toBe('br');
    expect(pickEncoding('deflate')).toBeUndefined();
    expect(pickEncoding('')).toBeUndefined();
  });
});
