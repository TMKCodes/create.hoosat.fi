import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import nodemailer from "nodemailer";

/**
 * Dependency update check for the Hoosat Create stack.
 *
 * Once a day the server reads the package.json files of the stack (this site and the template that
 * `npx hoosat-create` installs), asks the npm registry for newer releases and emails a summary when
 * it finds updates that have not been reported yet. Every update is reported once; the email lists
 * everything that is still pending and marks what is new since the previous email.
 *
 * Like `min-release-age=7` in .npmrc, a release only counts after it has been public for 7 days,
 * so the email never suggests a version that `npm install` would refuse to install.
 */

export type UpdateKind = "major" | "minor" | "patch";

export interface Update {
  /** Which package.json the dependency is in, e.g. "hoosat-template". */
  source: string;
  name: string;
  /** dependencies, devDependencies, overrides... */
  field: string;
  /** The range written in package.json, e.g. "^19.3.1". */
  range: string;
  /** The lowest version the range allows, e.g. "19.3.1". */
  current: string;
  /** The newest version that is old enough to install. */
  latest: string;
  kind: UpdateKind;
  /** True when the range already allows `latest` (npm update), false when package.json must change. */
  inRange: boolean;
  /** Publish time of `latest` (ISO 8601). */
  released: string;
}

export interface DependencyReport {
  checkedAt: string;
  sources: string[];
  updates: Update[];
  errors: string[];
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

export interface DependencyCheckOptions {
  /** package.json files to check: local paths or http(s) URLs. */
  sources: string[];
  /** Who gets the email. */
  to: string;
  /** Hours between checks. */
  intervalHours: number;
  /** A release must be at least this many days old, the same rule as min-release-age in .npmrc. */
  minReleaseAgeDays: number;
  /** Packages whose new major versions are not reported (in-range updates still are). */
  ignoreMajor: string[];
  /** JSON file that remembers which updates were already emailed. */
  stateFile: string;
  /** SMTP server. Without it the report is only logged. */
  smtp?: SmtpSettings;
  /** Email every pending update, not only new ones (used by --check-dependencies). */
  force?: boolean;
  /** Overridable for tests. */
  fetch?: typeof fetch;
  send?: (message: MailMessage) => Promise<void>;
  now?: () => Date;
  log?: (message: string) => void;
}

const REGISTRY = "https://registry.npmjs.org/";
const TEMPLATE_PACKAGE_JSON = "https://raw.githubusercontent.com/TMKCodes/hoosat-template/main/package.json";
const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies", "overrides"];
const DAY = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------------------------------------
 * Versions. The stack only uses plain ranges ("^1.2.3", "~1.2.3", "1.2.3", ">=1.2.3"), so a small
 * implementation is enough; anything else (tags, git URLs, || ranges) is skipped.
 * ---------------------------------------------------------------------------------------------- */

type Version = [number, number, number];

/** Parses a stable version. Prereleases ("1.0.0-beta.1") return null, they are never suggested. */
export const parseVersion = (value: string): Version | null => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
};

export const compareVersions = (a: Version, b: Version): number => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const formatVersion = (v: Version): string => v.join(".");

interface Range {
  operator: "^" | "~" | "=" | ">=";
  floor: Version;
}

export const parseRange = (range: string): Range | null => {
  const match = /^\s*(\^|~|>=|=)?\s*v?(\d+\.\d+\.\d+)\s*$/.exec(range);
  const floor = match && parseVersion(match[2]);
  if (!match || !floor) return null;
  return { operator: (match[1] ?? "=") as Range["operator"], floor };
};

export const satisfies = (range: Range, v: Version): boolean => {
  const { operator, floor } = range;
  if (compareVersions(v, floor) < 0) return false;
  switch (operator) {
    case ">=":
      return true;
    case "=":
      return compareVersions(v, floor) === 0;
    case "~":
      return v[0] === floor[0] && v[1] === floor[1];
    case "^":
      if (floor[0] > 0) return v[0] === floor[0];
      if (floor[1] > 0) return v[0] === 0 && v[1] === floor[1];
      return v[0] === 0 && v[1] === 0 && v[2] === floor[2];
  }
};

export const updateKind = (from: Version, to: Version): UpdateKind =>
  to[0] !== from[0] ? "major" : to[1] !== from[1] ? "minor" : "patch";

/* ------------------------------------------------------------------------------------------------
 * Reading the stack's package.json files and the npm registry.
 * ---------------------------------------------------------------------------------------------- */

interface Dependency {
  source: string;
  name: string;
  field: string;
  range: string;
}

interface PackageJson {
  name?: string;
  repository?: string | { url?: string };
  [field: string]: unknown;
}

/** A readable name for a package.json: the repository name ("hoosat-template"), else the package name. */
const sourceLabel = (pkg: PackageJson, spec: string): string => {
  const url = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  const repo = url?.replace(/\.git$/, "").split("/").pop();
  return repo || pkg.name || spec;
};

const fetchJson = async <T>(fetcher: typeof fetch, url: string, headers: Record<string, string> = {}): Promise<T> => {
  const response = await fetcher(url, { headers, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return (await response.json()) as T;
};

const readPackageJson = async (fetcher: typeof fetch, spec: string): Promise<PackageJson> =>
  /^https?:\/\//.test(spec)
    ? fetchJson<PackageJson>(fetcher, spec, { "Cache-Control": "no-cache" })
    : (JSON.parse(await readFile(spec, "utf8")) as PackageJson);

const listDependencies = (pkg: PackageJson, source: string): Dependency[] =>
  DEPENDENCY_FIELDS.flatMap((field) =>
    Object.entries((pkg[field] ?? {}) as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([name, range]) => ({ source, name, field, range })),
  );

const registryUrl = (name: string): string => REGISTRY + name.replace("/", "%2F");

interface Packument {
  "dist-tags"?: { latest?: string };
  time?: Record<string, string>;
}

/** Runs `task` for every item, at most `limit` at a time. */
const forEachLimited = async <T>(items: T[], limit: number, task: (item: T) => Promise<void>): Promise<void> => {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await task(item);
  });
  await Promise.all(workers);
};

/**
 * Checks every package.json in `options.sources` and returns the updates that can be installed now.
 * A dependency can produce two updates: the newest release its range already allows, and the
 * newest release overall when that one is outside the range (usually a new major version).
 */
export const checkDependencies = async (options: DependencyCheckOptions): Promise<DependencyReport> => {
  const fetcher = options.fetch ?? fetch;
  const now = (options.now ?? (() => new Date()))();
  const cutoff = now.getTime() - options.minReleaseAgeDays * DAY;
  const report: DependencyReport = { checkedAt: now.toISOString(), sources: [], updates: [], errors: [] };

  const dependencies: Dependency[] = [];
  for (const spec of options.sources) {
    try {
      const pkg = await readPackageJson(fetcher, spec);
      const source = sourceLabel(pkg, spec);
      report.sources.push(source);
      dependencies.push(...listDependencies(pkg, source));
    } catch (error) {
      report.errors.push(`Could not read ${spec}: ${(error as Error).message}`);
    }
  }

  const byName = new Map<string, { dependency: Dependency; range: Range }[]>();
  for (const dependency of dependencies) {
    const range = parseRange(dependency.range);
    if (!range) continue;
    byName.set(dependency.name, [...(byName.get(dependency.name) ?? []), { dependency, range }]);
  }

  await forEachLimited([...byName.keys()], 4, async (name) => {
    const entries = byName.get(name)!;
    try {
      // The small "latest" document first; the full one (megabytes for some packages) only when needed.
      const latest = parseVersion((await fetchJson<{ version: string }>(fetcher, `${registryUrl(name)}/latest`)).version);
      if (!latest || entries.every(({ range }) => compareVersions(latest, range.floor) <= 0)) return;

      const packument = await fetchJson<Packument>(fetcher, registryUrl(name));
      const time = packument.time ?? {};
      const installable = Object.keys(time)
        .map((key) => ({ key, version: parseVersion(key) }))
        .filter((v): v is { key: string; version: Version } => v.version !== null)
        .filter(({ key, version }) => compareVersions(version, latest) <= 0 && Date.parse(time[key]) <= cutoff)
        .sort((a, b) => compareVersions(b.version, a.version));

      for (const { dependency, range } of entries) {
        const newer = installable.filter(({ version }) => compareVersions(version, range.floor) > 0);
        const inRange = newer.find(({ version }) => satisfies(range, version));
        const overall = newer[0];
        const add = (found: { key: string; version: Version }, isInRange: boolean) =>
          report.updates.push({
            ...dependency,
            current: formatVersion(range.floor),
            latest: found.key,
            kind: updateKind(range.floor, found.version),
            inRange: isInRange,
            released: time[found.key],
          });
        if (inRange) add(inRange, true);
        if (overall && overall !== inRange && !options.ignoreMajor.includes(name)) add(overall, false);
      }
    } catch (error) {
      report.errors.push(`Could not check ${name}: ${(error as Error).message}`);
    }
  });

  report.updates.sort((a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name) || Number(a.inRange) - Number(b.inRange));
  return report;
};

/* ------------------------------------------------------------------------------------------------
 * Email.
 * ---------------------------------------------------------------------------------------------- */

export const updateKey = (u: Update): string => `${u.source}|${u.field}|${u.name}@${u.latest}`;

export const formatReport = (report: DependencyReport, isNew: (u: Update) => boolean): string => {
  const lines: string[] = [
    `Dependency check of the Hoosat Create stack, ${report.checkedAt}.`,
    `Only releases that are at least the min-release-age old are listed, so npm will install them.`,
    "",
  ];
  for (const source of report.sources) {
    const updates = report.updates.filter((u) => u.source === source);
    if (updates.length === 0) continue;
    lines.push(`== ${source} ==`, "");
    const row = (u: Update) =>
      `  ${isNew(u) ? "NEW " : "    "}${u.name}  ${u.range} -> ${u.latest}  (${u.kind}, ${u.field}, released ${u.released.slice(0, 10)})`;
    const outside = updates.filter((u) => !u.inRange);
    const inside = updates.filter((u) => u.inRange);
    if (outside.length) {
      lines.push("Outside the current range, package.json must change (read the changelog first):");
      lines.push(...outside.map(row));
      const install = outside.filter((u) => u.field !== "overrides").map((u) => `${u.name}@${/^~/.test(u.range) ? "~" : "^"}${u.latest}`);
      if (install.length) lines.push("", `  npm install ${install.join(" ")}`);
      lines.push("");
    }
    if (inside.length) {
      lines.push("Allowed by the current range, refresh package-lock.json (and raise the range floor):");
      lines.push(...inside.map(row), "", "  npm update", "");
    }
  }
  if (report.errors.length) {
    lines.push("Problems during the check:", ...report.errors.map((e) => `  ${e}`), "");
  }
  lines.push("Details of every package: https://www.npmjs.com/package/<name>");
  return lines.join("\n");
};

const smtpSender = (smtp: SmtpSettings) => {
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    // Port 587 (submission): refuse to send the password unless STARTTLS succeeds.
    requireTLS: !smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    // Encrypted, but the certificate is not checked: the mail server is mailcow on the same host,
    // reached at 127.0.0.1, and its certificate is issued for mail.hoosat.fi.
    tls: { rejectUnauthorized: false },
  });
  return async (message: MailMessage) => {
    await transport.sendMail({ from: smtp.from, ...message });
  };
};

/* ------------------------------------------------------------------------------------------------
 * Running and scheduling.
 * ---------------------------------------------------------------------------------------------- */

interface State {
  notified: string[];
  lastCheck?: string;
}

const readState = async (file: string): Promise<State> => {
  try {
    return JSON.parse(await readFile(file, "utf8")) as State;
  } catch {
    return { notified: [] };
  }
};

const writeState = async (file: string, state: State): Promise<void> => {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(state, null, 2));
};

/**
 * Checks once and emails when there are updates that were not emailed before (or any update with
 * `force`). Returns the report. Never throws for registry problems, only for a failed email.
 */
export const runDependencyCheck = async (options: DependencyCheckOptions): Promise<DependencyReport> => {
  const log = options.log ?? ((message: string) => console.log(`[dependency-check] ${message}`));
  const report = await checkDependencies(options);
  const state = await readState(options.stateFile);
  const notified = new Set(state.notified);
  const isNew = (u: Update) => !notified.has(updateKey(u));
  const fresh = report.updates.filter(isNew);

  log(`${report.updates.length} update(s) pending, ${fresh.length} new, ${report.errors.length} error(s).`);
  for (const error of report.errors) log(error);

  const shouldEmail = report.updates.length > 0 && (fresh.length > 0 || options.force);
  if (shouldEmail) {
    const send = options.send ?? (options.smtp ? smtpSender(options.smtp) : undefined);
    const majors = report.updates.filter((u) => !u.inRange).length;
    const message: MailMessage = {
      to: options.to,
      subject:
        `[Hoosat Create] ${report.updates.length} dependency update(s)` +
        (majors ? `, ${majors} outside the current range` : "") +
        (fresh.length ? ` (${fresh.length} new)` : ""),
      text: formatReport(report, isNew),
    };
    if (!send) {
      log(`SMTP_HOST is not set, not emailing. The report would have been:\n${message.text}`);
      return report;
    }
    await send(message);
    log(`Emailed ${options.to}.`);
  }

  // Remember only what is still pending, so a version that comes back later is reported again.
  const pending = report.updates.map(updateKey);
  await writeState(options.stateFile, {
    notified: shouldEmail ? pending : pending.filter((key) => notified.has(key)),
    lastCheck: report.checkedAt,
  });
  return report;
};

const list = (value: string | undefined): string[] | undefined =>
  value === undefined ? undefined : value.split(",").map((s) => s.trim()).filter(Boolean);

const number = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(parsed) ? parsed : fallback;
};

/** Reads the settings from environment variables, see the README for the list. */
export const dependencyCheckOptionsFromEnv = (env: NodeJS.ProcessEnv): DependencyCheckOptions => {
  const port = number(env.SMTP_PORT, 587);
  return {
    sources: list(env.DEPENDENCY_CHECK_SOURCES) ?? ["package.json", TEMPLATE_PACKAGE_JSON],
    to: env.DEPENDENCY_CHECK_EMAIL || "toni.lukkaroinen@hoosat.fi",
    intervalHours: number(env.DEPENDENCY_CHECK_INTERVAL_HOURS, 24),
    minReleaseAgeDays: number(env.DEPENDENCY_CHECK_MIN_RELEASE_AGE_DAYS, 7),
    // The stack supports Node.js 22 and newer, so @types/node stays on the oldest supported major.
    ignoreMajor: list(env.DEPENDENCY_CHECK_IGNORE_MAJOR) ?? ["@types/node"],
    stateFile: env.DEPENDENCY_CHECK_STATE || "data/dependency-check.json",
    smtp: env.SMTP_HOST
      ? {
          host: env.SMTP_HOST,
          port,
          secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
          user: env.SMTP_USER || undefined,
          pass: env.SMTP_PASS || undefined,
          from: env.SMTP_FROM || env.SMTP_USER || "noreply@hoosat.fi",
        }
      : undefined,
  };
};

/**
 * Starts the daily check in the running server: the first run a minute after start-up, then every
 * `intervalHours`. The timers do not keep the process alive and errors are only logged.
 * Returns a function that stops the schedule.
 */
export const startDependencyCheck = (options: DependencyCheckOptions): (() => void) => {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await runDependencyCheck(options);
    } catch (error) {
      console.error(`[dependency-check] ${(error as Error).message}`);
    } finally {
      running = false;
    }
  };
  const first = setTimeout(run, 60_000);
  const interval = setInterval(run, Math.max(options.intervalHours, 1) * 60 * 60 * 1000);
  first.unref();
  interval.unref();
  return () => {
    clearTimeout(first);
    clearInterval(interval);
  };
};
