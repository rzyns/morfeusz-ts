// Checks for required dictionary files. Used by src/index.ts to short-circuit createInstance().
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Derive dirname in ESM context
// Use fileURLToPath to normalize Windows paths from file URLs
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const dictDir: string = path.join(__dirname, '..', 'dictionaries');
// Binary dictionary files produced by official archives (.tgz)
// SGJP provides two variants: "a" (agglutinative) and "s" (strict?)
// Accept either variant being present.
export const required = [
  'sgjp-a.dict',
  'sgjp-s.dict',
  'polimorf-a.dict',
  'polimorf-s.dict',
] as const;

export function allPresent(): boolean {
  const exists = (f: string) => fs.existsSync(path.join(dictDir, f));
  const hasSGJP = exists('sgjp-a.dict') || exists('sgjp-s.dict');
  const hasPolimorf = exists('polimorf-a.dict') || exists('polimorf-s.dict');
  return hasSGJP && hasPolimorf;
}
