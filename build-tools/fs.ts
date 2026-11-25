import fs from 'node:fs';

/**
 * Cross-platform file system helpers for npm scripts (replaces `rm -rf`, `mkdirp` and `ncp`,
 * which do not work in Windows cmd or are no longer maintained).
 *
 * Usage:
 *   node build-tools/fs.ts rm <path> [<path> ...]
 *   node build-tools/fs.ts mkdir <path> [<path> ...]
 *   node build-tools/fs.ts cp <source> <destination>
 */
const [, , command, ...paths] = process.argv;

const usage = (): never => {
  console.error('Usage: node build-tools/fs.ts <rm|mkdir|cp> <paths...>');
  process.exit(1);
};

if (paths.length === 0) {
  usage();
}

switch (command) {
  case 'rm':
    for (const target of paths) {
      fs.rmSync(target, { recursive: true, force: true });
    }
    break;
  case 'mkdir':
    for (const target of paths) {
      fs.mkdirSync(target, { recursive: true });
    }
    break;
  case 'cp':
    if (paths.length !== 2) {
      usage();
    }
    fs.cpSync(paths[0], paths[1], { recursive: true });
    break;
  default:
    usage();
}
