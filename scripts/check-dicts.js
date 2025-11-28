// Checks for required dictionary files. Used by src/index.ts to short-circuit createInstance().
import * as fs from 'node:fs';
import * as path from 'node:path';

// Derive dirname in ESM context
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const dictDir = path.join(__dirname, '..', 'dictionaries');
// Binary dictionary files produced by official archives (.tgz)
// SGJP provides two variants: "a" (agglutinative) and "s" (strict?)
// Accept either variant being present.
export const required = [
  'sgjp-a.dict',
  'sgjp-s.dict',
  'polimorf-a.dict',
  'polimorf-s.dict',
];

export function allPresent() {
  const exists = (f) => fs.existsSync(path.join(dictDir, f));
  const hasSGJP = exists('sgjp-a.dict') || exists('sgjp-s.dict');
  const hasPolimorf = exists('polimorf-a.dict') || exists('polimorf-s.dict');
  return hasSGJP && hasPolimorf;
}
