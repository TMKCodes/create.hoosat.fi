// Runs before `npm run dev` and `npm run build`. Plain JavaScript on purpose, so it works on old Node.js
// versions too and can explain the problem instead of failing with ERR_UNKNOWN_FILE_EXTENSION.
// The other build tools are .ts files that Node.js runs directly with its built-in type stripping.
if (!process.features || !process.features.typescript) {
  console.error(
    `\nNode.js ${process.versions.node} can not run TypeScript files directly, which the build tools need.\n` +
    `Install Node.js 22, 24 or 26 (see .nvmrc), for example:\n` +
    `  Windows:      winget install OpenJS.NodeJS.LTS\n` +
    `  macOS/Linux:  nvm install 24 && nvm use 24\n` +
    `Then open a new terminal and check with: node --version\n`
  );
  process.exit(1);
}
