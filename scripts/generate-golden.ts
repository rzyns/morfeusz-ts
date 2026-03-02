#!/usr/bin/env -S bun
/**
 * scripts/generate-golden.ts
 *
 * Generates golden-master fixture files for test/golden.test.ts by running
 * morfeusz_analyzer against a word list and writing one JSON file per word.
 *
 * Usage:
 *   bun scripts/generate-golden.ts [--all] [--dict sgjp] [word ...]
 *
 * Flags:
 *   --all         Use the built-in WORD_LIST (covers all inflectional patterns)
 *   --dict <d>    Dict name passed to morfeusz_analyzer (default: sgjp)
 *   --out <dir>   Output directory (default: test/fixtures/golden/<dict>-a)
 *   --dry-run     Parse and print without writing files
 *
 * Requirements: morfeusz_analyzer on PATH, system dict installed.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Word list — systematic coverage of SGJP inflectional patterns
// ---------------------------------------------------------------------------
const WORD_LIST: string[] = [
	// Nouns: masculine animate m1
	"kot", "pies", "mężczyzna", "chłopiec", "student",
	// Nouns: masculine animate m2 (small animals)
	"kret", "szczur",
	// Nouns: masculine inanimate m3
	"stół", "dom", "samochód", "rok",
	// Nouns: feminine
	"kobieta", "matka", "córka", "rzeka", "noc",
	// Nouns: neuter
	"okno", "miasto", "dziecko", "morze",
	// Adjectives
	"dobry", "duży", "stary", "nowy", "czerwony",
	// Verbs: imperfective
	"robić", "czytać", "pisać", "mówić",
	// Verbs: perfective
	"zrobić", "napisać", "powiedzieć",
	// Verbs: irregular
	"być", "mieć", "iść", "wiedzieć",
	// Prepositions
	"w", "z", "na", "po", "do", "od", "przy", "przed", "przez", "za",
	// Conjunctions/particles
	"i", "ale", "że", "bo", "lub", "oraz",
	// Pronouns
	"ja", "ty", "on", "ona", "ono", "my", "wy", "się",
	// Adverbs
	"dobrze", "szybko", "bardzo", "już", "też",
	// Numerals
	"jeden", "dwa", "trzy", "pięć", "sto", "tysiąc",

	// Inflected forms (tests suffix-cut path, not headwords)
	"psa", "psu",
	"kota", "kotów",
	"kobiety", "kobiecie",
	"okna",
	"dobrego", "dobremu",
	"czyta", "pisał",
	"idę",
	"jest", "ma",

	// Diacritics
	"żółw", "źródło", "ścieżka", "łódź", "środa",

	// Case variants
	"Kot", "KOT",
	"Warszawa", "warszawa", "WARSZAWA",
	"Kraków", "Anna", "Jan", "Polska",

	// Absent from dictionary
	"qwerty", "xyzzy", "aaabbb",

	// Long / morphologically complex
	"przeczytałbym", "nieprzyzwyczajony",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GoldenResult {
	orth: string;
	lemma: string;
	tag: string;
	name: string;
	labels: string[];
	tagId: number | null;
	nameId: number | null;
	labelsId: number | null;
}

interface GoldenFixture {
	word: string;
	dict: string;
	generatedAt: string;
	generatedBy: string;
	results: GoldenResult[];
}

// ---------------------------------------------------------------------------
// Run morfeusz_analyzer for a single word
// stdout = analysis results  stderr = header/version lines
// ---------------------------------------------------------------------------
function analyze(word: string, dictArg: string): { stdout: string; stderr: string } {
	const result = spawnSync(
		"morfeusz_analyzer",
		["--dict", dictArg],
		{ input: word + "\n", encoding: "utf-8", timeout: 5000 },
	);
	if (result.error) throw result.error;
	if (result.status !== 0 && !result.stdout) {
		const msg = result.stderr ?? "(no stderr)";
		throw new Error("morfeusz_analyzer exited " + String(result.status) + ": " + msg);
	}
	return { stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

// ---------------------------------------------------------------------------
// Detect analyzer version (version string is on stderr)
// ---------------------------------------------------------------------------
function detectVersion(dictArg: string): string {
	try {
		const { stderr } = analyze("kot", dictArg);
		const m = stderr.match(/Morfeusz analyzer, version: ([\d.]+)/);
		return m ? "morfeusz_analyzer " + m[1] : "morfeusz_analyzer (unknown)";
	} catch (e) {
		console.error("ERROR: morfeusz_analyzer not found or failed:", (e as Error).message);
		process.exit(1);
	}
}

// ---------------------------------------------------------------------------
// Parse morfeusz_analyzer stdout for a single word
// ---------------------------------------------------------------------------
function parseAnalyzerOutput(word: string, output: string): GoldenResult[] {
	// Results arrive as a [...] block; stdout contains ONLY results (header is on stderr)
	const blockMatch = output.match(/\[[\s\S]*?\]/);
	if (!blockMatch) return [];

	const block = blockMatch[0]
		.replace(/^\[/, "")
		.replace(/\]$/, "")
		.trim();

	if (!block) return [];

	// First interp is flush against "["; subsequent ones have a leading space.
	const lines = block.split(/\n /).map(l => l.trim()).filter(Boolean);

	return lines.map(line => {
		// Fields (comma-separated):
		//   0: startNode  1: endNode  2: orth  3: lemma  4: tag
		//   5: name       6+: labels (may be "_" or "label1|label2")
		const parts = line.split(",");
		const orth   = parts[2] ?? word;
		const lemma  = parts[3] ?? "";
		const tag    = parts[4] ?? "";
		const name   = parts[5] ?? "";
		const rawLabels = parts.slice(6);
		const labels =
			rawLabels.length === 0 ||
			(rawLabels.length === 1 && rawLabels[0] === "_")
				? []
				: rawLabels
					.flatMap(t => t.split("|"))
					.map(t => t.trim())
					.filter(t => t.length > 0 && t !== "_");

		return {
			orth, lemma, tag, name, labels,
			tagId: null, nameId: null, labelsId: null,
		};
	});
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
let useAll   = false;
let dictName = "sgjp";
let outDir: string | null = null;
let dryRun   = false;
const extraWords: string[] = [];

for (let i = 0; i < args.length; i++) {
	const a = args[i]!;
	if (a === "--all")                        { useAll = true; }
	else if (a === "--dry-run")               { dryRun = true; }
	else if (a === "--dict" && args[i + 1])   { dictName = args[++i]!; }
	else if (a === "--out"  && args[i + 1])   { outDir   = args[++i]!; }
	else if (!a.startsWith("--"))             { extraWords.push(a); }
}

const wordList = extraWords.length > 0 ? extraWords : WORD_LIST;
if (extraWords.length === 0 && !useAll) {
	console.log("No words specified — using full WORD_LIST. Pass --all to suppress this note.");
}

// ---------------------------------------------------------------------------
// Output directory
// ---------------------------------------------------------------------------
const root       = fileURLToPath(new URL("..", import.meta.url));
const fixtureDir = resolve(outDir ?? join(root, "test", "fixtures", "golden", dictName + "-a"));

if (!dryRun) {
	mkdirSync(fixtureDir, { recursive: true });
	console.log("Output dir: " + fixtureDir);
}

const analyzerVersion = detectVersion(dictName);
console.log("Generator: " + analyzerVersion + "\n");

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let written = 0;
let errors  = 0;

for (const word of wordList) {
	try {
		const { stdout } = analyze(word, dictName);
		const results    = parseAnalyzerOutput(word, stdout);

		const fixture: GoldenFixture = {
			word,
			dict: dictName,
			generatedAt: new Date().toISOString(),
			generatedBy: analyzerVersion,
			results,
		};

		if (dryRun) {
			const summary =
				results.length === 0
					? "(not in dict)"
					: results.map(r => r.lemma).join(", ");
			console.log("[dry-run]  " + word.padEnd(24) + "  " + String(results.length) + " interp(s): " + summary);
			continue;
		}

		// Safe filename: NFC + replace filesystem-unsafe chars
		const safeName = word.normalize("NFC").replace(/[/\\:*?"<>|]/g, "_");
		const outPath  = join(fixtureDir, safeName + ".json");
		writeFileSync(outPath, JSON.stringify(fixture, null, "\t") + "\n", "utf-8");
		console.log("  ✓  " + word.padEnd(24) + " → " + String(results.length) + " interp(s)");
		written++;
	} catch (err) {
		console.error("  ✗  " + word + ": " + (err as Error).message);
		errors++;
	}
}

if (!dryRun) {
	console.log("\n" + String(written) + " fixture(s) written, " + String(errors) + " error(s).");
	if (errors === 0) {
		console.log("Commit the fixtures and run: pnpm test test/golden.test.ts");
	}
}
