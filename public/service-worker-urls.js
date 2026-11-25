import { readdirSync, statSync, writeFileSync } from "fs";
import { join, relative, sep } from "path";

// The build directory can be passed as the first argument, otherwise it is picked by NODE_ENV.
const baseDirectory = process.argv[2]
  || (process.env.NODE_ENV === "development" ? "build-dev/public" : "build/public");
const outputFile = join(baseDirectory, "service-worker-urls.js");

function walkSync(directory, filelist = []) {
  readdirSync(directory).forEach((file) => {
    const fullPath = join(directory, file);

    if (statSync(fullPath).isDirectory()) {
      walkSync(fullPath, filelist);
    } else {
      // Always use URL style forward slashes, also on Windows.
      filelist.push(relative(baseDirectory, fullPath).split(sep).join("/"));
    }
  });

  return filelist;
}

const files = walkSync(baseDirectory);
files.push("/");

const content = `
  const urlsToCache = ${JSON.stringify(files)};
  self.urlsToCache = urlsToCache;
`;

writeFileSync(outputFile, content);

console.log(`Generated ${outputFile} with ${files.length} URLs.`);
