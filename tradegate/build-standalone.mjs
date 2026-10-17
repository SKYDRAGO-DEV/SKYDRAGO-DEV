/**
 * Deterministically bundles the verified source into a standalone HTML file.
 * Run from repository root: node tradegate/build-standalone.mjs
 * Standalone file imports no remote scripts, CSS, fonts or local modules.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const directory = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(join(directory, name), "utf8");
const html = read("index.html");
const css = read("style.css");
const engine = read("engine.mjs");
const app = read("app.mjs");

const importLine = 'import { assessTrade, evidenceStatus, PROFILES, DEMOS } from "./engine.mjs";';
if (!app.startsWith(importLine)) {
  throw new Error("Unexpected app module import; refusing to create incomplete standalone bundle");
}
const scriptTag = '<script type="module" src="./app.mjs"></script>';
const styleTag = '<link rel="stylesheet" href="./style.css">';
if (!html.includes(scriptTag) || !html.includes(styleTag)) {
  throw new Error("Cannot identify expected local assets");
}
if (css.includes("@import") || css.includes("url(http")) {
  throw new Error("External font or stylesheet detected; standalone must be fully offline");
}
const engineBody = engine.replace(/^export /gm, "");
const appBody = app.slice(importLine.length).trimStart();
const combined = engineBody + "\n\n" + appBody;
if (combined.includes("</script")) throw new Error("Unsafe inline script closing sequence");
const bundled = html
  .replace(styleTag, "<style>\n" + css + "\n</style>")
  .replace(scriptTag, '<script type="module">\n' + combined + '\n</script>');
if (bundled.includes('src="./app.mjs"') || bundled.includes('href="./style.css"')) {
  throw new Error("External module or stylesheet reference remains");
}
writeFileSync(join(directory, "standalone.html"), bundled, "utf8");
console.log("TRADEGATE portable standalone created: " + Buffer.byteLength(bundled, "utf8") + " bytes");
