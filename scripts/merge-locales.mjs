import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');
const nestedDir = path.join(localesDir, 'nested');

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  for (const key of Object.keys(source)) {
    const sv = source[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      deepMerge(target[key], sv);
    } else {
      target[key] = sv;
    }
  }
  return target;
}

function loadNested(lang) {
  const dir = path.join(nestedDir, lang);
  if (!fs.existsSync(dir)) return {};
  const merged = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    deepMerge(merged, data);
  }
  return merged;
}

for (const lang of ['fr', 'en']) {
  const basePath = path.join(localesDir, `${lang}.json`);
  const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  const nested = loadNested(lang);
  const result = deepMerge({ ...base }, nested);
  fs.writeFileSync(basePath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`Merged ${lang}.json`);
}
