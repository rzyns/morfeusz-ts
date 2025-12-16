import type {
	InterpsGroupsReader,
	InterpsGroup
} from "./InterpsGroupsReader.js";
import type { MorphInterpretation, IdResolver } from "../types.js";
import { CaseHandling } from "../types.js";
import {
	isOrthOnlyLower,
	isOrthOnlyTitle,
	hasCompressedPrefixCut,
	getPrefixCutLength,
	isLemmaOnlyLower,
	isLemmaOnlyTitle
} from "./compression.js";
import { readCString } from "../binary/readers.js";
import { CaseConverter } from "../case/CaseConverter.js";
import { CasePatternHelper } from "../case/CasePatternHelper.js";

export class InterpsGroupsDecoder {
	private getInterpretationsOffset(group: InterpsGroup): number {
		// For analyzer payloads, groups start with a compression/type byte; interpretations follow immediately.
		// If non-compressed patterns were present, they'd be here, but current implementation assumes compressed.
		return group.ptr + 1;
	}

	decode(
		orth: string,
		reader: InterpsGroupsReader,
		_ids: IdResolver,
		handling: CaseHandling
	): MorphInterpretation[] {
		const matched: MorphInterpretation[] = [];
		const all: MorphInterpretation[] = [];
		const conv = new CaseConverter();
		const caseHelper = new CasePatternHelper(conv);
		while (reader.hasNext()) {
			const g = reader.getNext();
			const start = this.getInterpretationsOffset(g);
			let ptr = start;
			const end = g.ptr + g.size;
			const dv = reader.getView();
			while (ptr < end) {
				// Decode EncodedInterpretation fields according to C++ layout
				// EncodedForm: prefixToCut, suffixToCut, suffixToAdd
				let prefixToCut = 0;
				if (hasCompressedPrefixCut(g.type)) {
					prefixToCut = getPrefixCutLength(g.type) & 0xff;
				} else {
					if (ptr >= dv.byteLength) break;
					prefixToCut = dv.getUint8(ptr);
					ptr += 1;
				}
				if (ptr >= dv.byteLength) break;
				const suffixToCut = dv.getUint8(ptr);
				ptr += 1;
				// Read C-string suffixToAdd
				const { value: suffixToAdd, next: nextAfterSuffix } =
					readCString(dv, ptr);
				ptr = nextAfterSuffix;
				// Lemma case pattern: compressed via group.type flags; no explicit bytes when only-lower/title
				// Tags
				if (ptr + 2 > dv.byteLength) break;
				const tag = dv.getUint16(ptr, false);
				ptr += 2;
				let nameClassifier = 0;
				if (ptr < dv.byteLength) {
					nameClassifier = dv.getUint8(ptr);
					ptr += 1;
				}
				let qualifiers = 0;
				if (ptr + 2 <= dv.byteLength) {
					qualifiers = dv.getUint16(ptr, false);
					ptr += 2;
				}

				// Assemble lemma from orth using cuts and addition
				const safePrefix = Math.min(
					Math.max(prefixToCut, 0),
					orth.length
				);
				const safeSuffixCut = Math.min(
					Math.max(suffixToCut, 0),
					Math.max(orth.length - safePrefix, 0)
				);
				const coreEnd = Math.max(
					orth.length - safeSuffixCut,
					safePrefix
				);
				const core = orth.slice(safePrefix, coreEnd);
				let lemma = core + suffixToAdd;
				lemma = caseHelper.applyLemmaCase(lemma, g.type);

				const interp: MorphInterpretation = {
					startNode: 0,
					endNode: 0,
					orth,
					lemma,
					tagId: tag,
					nameId: nameClassifier,
					labelsId: qualifiers
				};
				const matchesStrict = caseHelper.orthMatches(
					g.type,
					orth,
					CaseHandling.STRICTLY_CASE_SENSITIVE
				);
				all.push(interp);
				if (handling === CaseHandling.STRICTLY_CASE_SENSITIVE) {
					if (matchesStrict) matched.push(interp);
				} else if (
					handling === CaseHandling.CONDITIONALLY_CASE_SENSITIVE
				) {
					if (matchesStrict) matched.push(interp);
				} else {
					// IGNORE_CASE: keep everything
					matched.push(interp);
				}
			}
		}
		// Preference/fallback policy
		let res: MorphInterpretation[] = [];
		if (handling === CaseHandling.STRICTLY_CASE_SENSITIVE) {
			res = matched;
		} else if (handling === CaseHandling.CONDITIONALLY_CASE_SENSITIVE) {
			res = matched.length > 0 ? matched : all;
		} else {
			res = matched; // IGNORE_CASE == all
		}
		if (res.length === 0) {
			res.push({
				startNode: 0,
				endNode: 0,
				orth,
				lemma: orth,
				tagId: 0,
				nameId: 0,
				labelsId: 0
			});
		}
		return res;
	}
}
