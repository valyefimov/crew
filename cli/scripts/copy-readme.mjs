// npm shows README.md from the package root. Generate it from the repo README,
// turning relative links into absolute ones (relative images don't resolve on npmjs.com).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = (p) => fileURLToPath(new URL(`../../${p}`, import.meta.url));
const RAW = "https://raw.githubusercontent.com/valyefimov/crew/main";
const BLOB = "https://github.com/valyefimov/crew/blob/main";
const PAGES = "https://valyefimov.github.io/crew";

const readme = readFileSync(root("README.md"), "utf8")
  // SVGs from raw.githubusercontent are served as text/plain, so use the docs site for the logo
  .replaceAll('src="apps/web/public/logo.svg"', `src="${PAGES}/logo.svg"`)
  .replace(/src="((?:media)\/[^"]+)"/g, `src="${RAW}/$1"`)
  .replace(/\]\((LICENSE|\.nvmrc|CONTRIBUTING\.md)\)/g, `](${BLOB}/$1)`);

writeFileSync(fileURLToPath(new URL("../README.md", import.meta.url)), readme);
console.log("generated README.md for npm");
