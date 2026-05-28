/**
 * Bakes runtimeOverrides into locale JSON files (persistent translations).
 * Run: node scripts/merge-overrides-to-json.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import overrides from "../src/i18n/runtimeOverrides.js";

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

for (const [lang, resources] of Object.entries(overrides)) {
  const file = path.join(localeRoot, lang, "translation.json");
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  merge(json, resources);
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`Merged overrides → ${lang}/translation.json`);
}
