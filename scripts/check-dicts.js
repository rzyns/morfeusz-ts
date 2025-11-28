// Checks for required dictionary files. Used by src/index.ts to short-circuit createInstance().
const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, '..', 'dictionaries');
// Binary dictionary files produced by official archives (.tgz)
// SGJP provides two variants: "a" (agglutinative) and "s" (strict?)
// Accept either variant being present.
const required = [
  // SGJP (at least one of these should exist)
  'sgjp-a.dict',
  'sgjp-s.dict',
  // Polimorf (archive typically provides this name)
  'polimorf-a.dict',
  'polimorf-s.dict',
];

function allPresent() {
  const exists = (f) => fs.existsSync(path.join(dictDir, f));
  const hasSGJP = exists('sgjp-a.dict') || exists('sgjp-s.dict');
  const hasPolimorf = exists('polimorf.dict');
  return hasSGJP && hasPolimorf;
}

module.exports = { allPresent, dictDir, required };
