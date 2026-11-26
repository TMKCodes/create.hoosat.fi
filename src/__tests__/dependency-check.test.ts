import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  checkDependencies,
  DependencyCheckOptions,
  MailMessage,
  parseRange,
  parseVersion,
  runDependencyCheck,
  satisfies,
} from '../server/dependency-check';

const now = new Date('2026-11-26T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

/** A fake registry: package name -> { version: publish time }. The last stable key is "latest". */
const registry: Record<string, Record<string, string>> = {
  react: { '19.3.1': daysAgo(60), '19.4.0': daysAgo(20), '20.0.0': daysAgo(10), '20.1.0': daysAgo(2) },
  typescript: { '6.0.3': daysAgo(40), '6.0.4': daysAgo(9), '6.1.0': daysAgo(8) },
  ws: { '8.23.0': daysAgo(30) },
  '@types/node': { '22.20.5': daysAgo(30), '22.20.6': daysAgo(8), '26.6.11': daysAgo(8) },
  'only-new': { '1.0.0': daysAgo(100), '1.0.1': daysAgo(1) },
};

const sitePackageJson = {
  name: 'create.hoosat.fi',
  repository: { url: 'https://github.com/TMKCodes/create.hoosat.fi' },
  dependencies: { react: '^19.3.1', ws: '^8.23.0', 'only-new': '^1.0.0', local: 'file:../local' },
  devDependencies: { typescript: '~6.0.3', '@types/node': '^22.20.5' },
};

const fakeFetch = (async (input: string | URL | Request) => {
  const url = String(input);
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
  if (url === 'https://example.com/package.json') return json(sitePackageJson);
  const match = /^https:\/\/registry\.npmjs\.org\/([^/]+(?:%2F[^/]+)?)(\/latest)?$/.exec(url);
  const name = match && decodeURIComponent(match[1]);
  const times = name ? registry[name] : undefined;
  if (!times) return new Response('not found', { status: 404 });
  const latest = Object.keys(times).filter((v) => !v.includes('-')).pop()!;
  return json(match![2] ? { version: latest } : { 'dist-tags': { latest }, time: { created: daysAgo(999), ...times } });
}) as typeof fetch;

const options = (stateFile: string, send?: (m: MailMessage) => Promise<void>): DependencyCheckOptions => ({
  sources: ['https://example.com/package.json'],
  to: 'someone@example.com',
  intervalHours: 24,
  minReleaseAgeDays: 7,
  ignoreMajor: ['@types/node'],
  stateFile,
  fetch: fakeFetch,
  send,
  now: () => now,
  log: () => undefined,
});

describe('versions and ranges', () => {
  it('parses stable versions only', () => {
    expect(parseVersion('19.3.1')).toEqual([19, 3, 1]);
    expect(parseVersion('19.3.0-canary-1')).toBeNull();
  });

  it('follows npm caret and tilde rules', () => {
    const caret = parseRange('^19.3.1')!;
    expect(satisfies(caret, [19, 9, 0])).toBe(true);
    expect(satisfies(caret, [20, 0, 0])).toBe(false);
    expect(satisfies(caret, [19, 3, 0])).toBe(false);
    expect(satisfies(parseRange('^0.28.20')!, [0, 29, 0])).toBe(false);
    expect(satisfies(parseRange('~6.0.3')!, [6, 1, 0])).toBe(false);
    expect(satisfies(parseRange('~6.0.3')!, [6, 0, 9])).toBe(true);
    expect(parseRange('file:../local')).toBeNull();
  });
});

describe('checkDependencies', () => {
  it('reports in-range and out-of-range updates that are old enough to install', async () => {
    const report = await checkDependencies(options('unused'));
    const found = report.updates.map((u) => `${u.name} ${u.latest} ${u.inRange ? 'in' : 'out'} ${u.kind}`);
    expect(found.sort()).toEqual([
      '@types/node 22.20.6 in patch', // the 26.x major is ignored on purpose
      'react 19.4.0 in minor',
      'react 20.0.0 out major', // 20.1.0 is only 2 days old
      'typescript 6.0.4 in patch',
      'typescript 6.1.0 out minor', // ~6.0.3 does not allow 6.1
    ]);
    // ws is up to date and only-new's release is too new to install.
    expect(report.errors).toEqual([]);
    expect(report.sources).toEqual(['create.hoosat.fi']);
  });
});

describe('runDependencyCheck', () => {
  it('emails new updates once and remembers them', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-check-'));
    const stateFile = path.join(dir, 'state', 'dependency-check.json');
    const sent: MailMessage[] = [];
    const send = async (m: MailMessage) => {
      sent.push(m);
    };

    await runDependencyCheck(options(stateFile, send));
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('someone@example.com');
    expect(sent[0].subject).toBe('[Hoosat Create] 5 dependency update(s), 2 outside the current range (5 new)');
    expect(sent[0].text).toContain('NEW react  ^19.3.1 -> 20.0.0  (major, dependencies');
    expect(sent[0].text).toContain('npm install react@^20.0.0 typescript@~6.1.0');

    // Nothing new: no second email.
    await runDependencyCheck(options(stateFile, send));
    expect(sent).toHaveLength(1);

    // --check-dependencies (force) sends the pending list again, without NEW marks.
    await runDependencyCheck({ ...options(stateFile, send), force: true });
    expect(sent).toHaveLength(2);
    expect(sent[1].text).not.toContain('NEW ');

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
