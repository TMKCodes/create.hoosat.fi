import http from 'node:http';
import { createRouter, createServer } from '../server/core/server';
import { writeNonceToFile } from '../server/core/nonce';
import { serverTiming } from '../server/timing';
import { formatMs, parseServerTiming } from '../client/performance';

describe('Server-Timing middleware', () => {
  beforeAll(() => {
    // The core reads the CSP nonce from ./.nonce on every request.
    writeNonceToFile();
  });

  it('adds the server time to every response', async () => {
    const router = createRouter();
    router.Middleware(serverTiming());
    router.Get('/timed', (_req, res) => {
      res.status(200).send('ok');
    });
    const server = createServer(router)!;
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as { port: number };
    const header = await new Promise<string | undefined>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/timed`, (res) => {
        res.resume();
        resolve(res.headers['server-timing'] as string | undefined);
      }).on('error', reject);
    });
    await new Promise((resolve) => server.close(resolve));
    expect(header).toMatch(/^hoosat;desc="Hoosat server";dur=\d+\.\d{2}$/);
    expect(parseServerTiming(header ?? null)).toBeGreaterThanOrEqual(0);
  });
});

describe('timing helpers', () => {
  it('parse the hoosat metric from a Server-Timing header', () => {
    expect(parseServerTiming('hoosat;desc="Hoosat server";dur=1.25')).toBe(1.25);
    expect(parseServerTiming('cache;dur=4, hoosat;dur=0.42')).toBe(0.42);
    expect(parseServerTiming('cache;dur=4')).toBeUndefined();
    expect(parseServerTiming(null)).toBeUndefined();
  });

  it('format milliseconds with precision that fits the size', () => {
    expect(formatMs(0.4234, 'en')).toBe('0.42');
    expect(formatMs(3.14, 'en')).toBe('3.1');
    expect(formatMs(264.4, 'en')).toBe('264');
    expect(formatMs(3.14, 'fi')).toBe('3,1');
  });
});
