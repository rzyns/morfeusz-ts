import type { InterpsGroupsReader } from "./InterpsGroupsReader.js";
import type { MorphInterpretation, IdResolver } from "../types.js";
import { CaseHandling } from "../types.js";
import { readCString } from "../binary/readers.js";

/**
 * Skip a serialized CasePattern from the byte stream and return the new offset.
 *
 * Format (from C++ CasePatternHelper::deserializeOneCasePattern):
 *   type=0x01  → 2 bytes (type + count)
 *   type=0x02  → 2 + count bytes (type + count + count bytes)
 *   any other  → 1 byte
 */
function skipCasePattern(dv: DataView, ptr: number): number {
	const b = dv.getUint8(ptr);
	if (b === 0x01) return ptr + 2;
	if (b === 0x02) return ptr + 2 + dv.getUint8(ptr + 1);
	return ptr + 1;
}

/**
 * groupTypeByte flags (first content byte of each group):
 *   bit7 (0x80): ORTH_ONLY_LOWER  — orth is all lowercase; no per-interp orth case pattern
 *   bit6 (0x40): ORTH_ONLY_TITLE  — orth is title case; 547d0 path in C++, no orth case pattern per interp
 *   bit5 (0x20): LEMMA_ONLY_LOWER — no per-interp lemma case pattern (skip it)
 *   bit4 (0x10): LEMMA_ONLY_TITLE — no lemma case bytes from stream (bit stored inline)
 *   bits3-0:     nibble; if 0xf → read 1 explicit field0 byte; else field0 = nibble (not used for lemma)
 */
function groupMatchesOrth(groupTypeByte: number, orth: string): boolean {
	// ORTH_ONLY_LOWER (bit7=1, bit6=0): all forms in group are lowercase
	if ((groupTypeByte & 0xc0) === 0x80) {
		return orth === orth.toLowerCase();
	}
	// ORTH_ONLY_TITLE (bit6=1, bit7=0): all forms in group are title case
	if ((groupTypeByte & 0xc0) === 0x40) {
		return (
			orth.length > 0 &&
			orth[0] === orth[0].toUpperCase() &&
			orth.slice(1) === orth.slice(1).toLowerCase()
		);
	}
	return true; // no orth restriction
}

export class InterpsGroupsDecoder {
	decode(
		orth: string,
		reader: InterpsGroupsReader,
		_ids: IdResolver,
		handling: CaseHandling = CaseHandling.CONDITIONALLY_CASE_SENSITIVE
	): MorphInterpretation[] {
		const matched: MorphInterpretation[] = [];
		const all: MorphInterpretation[] = [];

		while (reader.hasNext()) {
			const g = reader.getNext();
			const dv = reader.getView();

			// First byte of content is groupTypeByte — controls per-interp binary layout.
			// C++ processInterpsGroup reads it separately before calling decodeEncodedInterp.
			const groupTypeByte = dv.getUint8(g.ptr);

			// Whether this group uses the "547d0 path" in C++ (bit6=1, bit7=0).
			// That path does NOT call decodeEncodedForm, so no lemma case bytes from stream.
			const takes547d0 = (groupTypeByte & 0xc0) === 0x40;

			// Whether per-interp orth case pattern bytes exist in stream
			// (absent when bit7=1 OR bit6=1)
			const hasOrthCase = (groupTypeByte & 0xc0) === 0;

			// preLoopByte at content[1] is only present when hasOrthCase (groupTypeByte=0x00).
			// For 0xa0 (bit7=1) or 0x50 (bit6=1): no preLoopByte, loop starts at g.ptr+1.
			let ptr = g.ptr + (hasOrthCase ? 2 : 1);
			const end = g.ptr + g.size;

			const orthMatches = groupMatchesOrth(groupTypeByte, orth);

			// Whether per-interp lemma case pattern bytes exist in stream.
			// Only present when decodeEncodedForm path is taken AND bit5=0 AND bit4=0.
			const hasLemmaCase = !takes547d0 && (groupTypeByte & 0x30) === 0;

			const nibble = groupTypeByte & 0x0f;

			const groupInterps: MorphInterpretation[] = [];

			while (ptr < end) {
				// 1. Orth case pattern (skip — we return all interps regardless of case)
				if (hasOrthCase) {
					ptr = skipCasePattern(dv, ptr);
					if (ptr >= end) break;
				}

				// 2. Field0: nibble value OR explicit byte if nibble==0xf
				//    Encodes prefixToCut — number of chars to slice from the START of orth for lemma.
				let field0 = nibble;
				if (nibble === 0x0f) {
					if (ptr >= end) break;
					field0 = dv.getUint8(ptr);
					ptr++;
				}

				// 3. suffixToCut (1 byte)
				if (ptr >= end) break;
				const suffixToCut = dv.getUint8(ptr);
				ptr++;

				// 4. NUL-terminated suffixToAdd
				if (ptr >= end) break;
				const { value: suffixToAdd, next: afterSuffix } =
					readCString(dv, ptr);
				ptr = afterSuffix;

				// 5. Lemma case pattern (skip)
				if (hasLemmaCase) {
					if (ptr >= end) break;
					ptr = skipCasePattern(dv, ptr);
				}

				// 6. tagId[2 BE] + nameId[1] + labelsId[2 BE]
				if (ptr + 5 > end) break;
				const tagId = dv.getUint16(ptr, false);
				ptr += 2;
				const nameId = dv.getUint8(ptr);
				ptr++;
				const labelsId = dv.getUint16(ptr, false);
				ptr += 2;

				// 7. lemma = orth[prefixToCut..length-suffixToCut] + suffixToAdd
				//    field0 = prefixToCut (chars to remove from START of orth)
				const prefixToCut = field0;
				const stemEnd = Math.max(prefixToCut, orth.length - suffixToCut);
				const lemma = orth.slice(prefixToCut, stemEnd) + suffixToAdd;

				groupInterps.push({
					startNode: 0,
					endNode: 0,
					orth,
					lemma,
					tagId,
					nameId,
					labelsId
				});
			}

			all.push(...groupInterps);
			if (orthMatches) {
				matched.push(...groupInterps);
			}
		}

		const results =
			handling === CaseHandling.IGNORE_CASE
				? all
				: handling === CaseHandling.STRICTLY_CASE_SENSITIVE
					? matched
					: /* CONDITIONALLY_CASE_SENSITIVE */ matched.length > 0
						? matched
						: all;

		if (results.length === 0) {
			return [
				{
					startNode: 0,
					endNode: 0,
					orth,
					lemma: orth,
					tagId: 0,
					nameId: 0,
					labelsId: 0
				}
			];
		}
		return results;
	}
}
