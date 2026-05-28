/**
 * Merges page-section translations into locale JSON files.
 * Run: node scripts/apply-full-locales.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pagePatches } from "./locale-page-patches.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localeRoot = path.resolve(__dirname, "../src/i18n/locales");

function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = merge(
        target[key] && typeof target[key] === "object" ? { ...target[key] } : {},
        value
      );
    } else {
      target[key] = value;
    }
  }
  return target;
}

for (const [lang, patch] of Object.entries(pagePatches)) {
  const file = path.join(localeRoot, lang, "translation.json");
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  merge(json, patch);
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`Patched ${lang}/translation.json`);
}
