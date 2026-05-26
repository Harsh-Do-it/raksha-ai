import fs from 'node:fs';
import path from 'node:path';

const outputPath = path.resolve('public/favicon.svg');

const defaultSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="12" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1120"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="shield" x1="20" y1="10" x2="44" y2="49" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F87171"/>
      <stop offset="1" stop-color="#DC2626"/>
    </linearGradient>
    <filter id="shadow" x="8" y="8" width="48" height="48" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="4" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="64" height="64" rx="18" fill="url(#bg)"/>
  <circle cx="50" cy="14" r="4" fill="#F87171" fill-opacity="0.2"/>
  <circle cx="16" cy="48" r="3" fill="#F87171" fill-opacity="0.14"/>

  <g filter="url(#shadow)">
    <path d="M32 11L47 18.5V30.5C47 39.8 32 50 32 50C32 50 17 39.8 17 30.5V18.5L32 11Z" fill="url(#shield)"/>
    <path d="M32 11L47 18.5V30.5C47 39.8 32 50 32 50C32 50 17 39.8 17 30.5V18.5L32 11Z" stroke="#FEE2E2" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M25.5 29.5C27.5 31.8 29.8 33.2 32 33.2C34.2 33.2 36.5 31.8 38.5 29.5" stroke="#FFF7ED" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M32 24V34" stroke="#F8FAFC" stroke-width="2.2" stroke-linecap="round"/>
  </g>

  <text x="32" y="50" text-anchor="middle" fill="#F8FAFC" font-family="Arial, Helvetica, sans-serif" font-size="9" font-weight="700" letter-spacing="0.8">RAKSHA</text>
</svg>`;

function printUsage() {
  console.log(`Usage:
  node scripts/generate-favicon.mjs [--input path/to/icon.svg]

Examples:
  node scripts/generate-favicon.mjs
  node scripts/generate-favicon.mjs --input ../my-favicon.svg
  node scripts/generate-favicon.mjs --input=../my-favicon.svg`);
}

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

let customSvgPath = null;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--input') {
    customSvgPath = args[i + 1];
    i += 1;
    continue;
  }

  if (arg.startsWith('--input=')) {
    customSvgPath = arg.slice('--input='.length);
    continue;
  }

  if (arg.startsWith('--')) {
    console.error(`Unknown option: ${arg}`);
    printUsage();
    process.exit(1);
  }

  if (customSvgPath) {
    console.error(`Unexpected extra argument: ${arg}`);
    printUsage();
    process.exit(1);
  }

  customSvgPath = arg;
}

if (customSvgPath === undefined || customSvgPath === null) {
  customSvgPath = null;
}

if (customSvgPath && !fs.existsSync(path.resolve(customSvgPath))) {
  console.error(`Input SVG not found: ${customSvgPath}`);
  process.exit(1);
}

const sourceSvg = customSvgPath ? fs.readFileSync(path.resolve(customSvgPath), 'utf8') : defaultSvg;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, sourceSvg, 'utf8');

console.log(`Updated favicon at ${outputPath}${customSvgPath ? ` from ${customSvgPath}` : ''}`);
