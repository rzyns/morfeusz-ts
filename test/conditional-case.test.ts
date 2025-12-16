import { describe, it, expect } from "vitest";
import { InterpsGroupsReader } from "../src/core/deserialization/InterpsGroupsReader.js";
import { InterpsGroupsDecoder } from "../src/core/deserialization/InterpsGroupsDecoder.js";
import { CaseHandling } from "../src/core/types.js";

const CompressionFlags = {
  ORTH_ONLY_LOWER: 0x80,
  ORTH_ONLY_TITLE: 0x40,
  PREFIX_CUT_MASK: 0x0f,
} as const;

function makeGroupBuffer(typeByte: number, contentBytes: number[]): DataView {
  const size = contentBytes.length;
  const arr = new Uint8Array(1 + 2 + size);
  arr[0] = typeByte & 0xff;
  arr[1] = (size >>> 8) & 0xff;
  arr[2] = size & 0xff;
  for (let i = 0; i < size; i++) arr[3 + i] = contentBytes[i] & 0xff;
  return new DataView(arr.buffer);
}

function cstr(s: string): number[] { return [...Buffer.from(s, "utf8"), 0]; }

function minimalContent(type: number, tag: number) {
  const suffixToCut = 0;
  const name = 0;
  const labels = 0;
  return [
    type & 0xff,
    suffixToCut & 0xff,
    ...cstr(""),
    (tag >>> 8) & 0xff,
    tag & 0xff,
    name & 0xff,
    (labels >>> 8) & 0xff,
    labels & 0xff,
  ];
}

describe("conditional case preference and fallback", () => {
  it("prefers title-case when orth is 'Word'", () => {
    const titleType = CompressionFlags.ORTH_ONLY_TITLE;
    const lowerType = CompressionFlags.ORTH_ONLY_LOWER;
    const viewTitle = makeGroupBuffer(titleType, minimalContent(titleType, 10));
    const viewLower = makeGroupBuffer(lowerType, minimalContent(lowerType, 20));
    const reader = new InterpsGroupsReader();
    // Concatenate two group frames: title first, then lower
    const bytes = new Uint8Array(viewTitle.byteLength + viewLower.byteLength);
    bytes.set(new Uint8Array(viewTitle.buffer), 0);
    bytes.set(new Uint8Array(viewLower.buffer), viewTitle.byteLength);
    const combo = new DataView(bytes.buffer);
    reader.update(combo, 0, combo.byteLength);
    const dec = new InterpsGroupsDecoder();
    const res = dec.decode("Word", reader, {
      getTagsetId: () => "",
      getTag: () => "",
      getTagId: () => 0,
      getName: () => "",
      getNameId: () => 0,
      getLabelsAsString: () => "",
      getLabels: () => new Set<string>(),
      getLabelsId: () => 0,
      getTagsCount: () => 0,
      getNamesCount: () => 0,
      getLabelsCount: () => 0,
    }, CaseHandling.CONDITIONALLY_CASE_SENSITIVE);
    expect(res.length).toBe(1);
    expect(res[0].tagId).toBe(10);
  });

  it("prefers lower-case when orth is 'word'", () => {
    const titleType = CompressionFlags.ORTH_ONLY_TITLE;
    const lowerType = CompressionFlags.ORTH_ONLY_LOWER;
    const viewTitle = makeGroupBuffer(titleType, minimalContent(titleType, 10));
    const viewLower = makeGroupBuffer(lowerType, minimalContent(lowerType, 20));
    const reader = new InterpsGroupsReader();
    const bytes = new Uint8Array(viewTitle.byteLength + viewLower.byteLength);
    bytes.set(new Uint8Array(viewTitle.buffer), 0);
    bytes.set(new Uint8Array(viewLower.buffer), viewTitle.byteLength);
    const combo = new DataView(bytes.buffer);
    reader.update(combo, 0, combo.byteLength);
    const dec = new InterpsGroupsDecoder();
    const res = dec.decode("word", reader, {
      getTagsetId: () => "",
      getTag: () => "",
      getTagId: () => 0,
      getName: () => "",
      getNameId: () => 0,
      getLabelsAsString: () => "",
      getLabels: () => new Set<string>(),
      getLabelsId: () => 0,
      getTagsCount: () => 0,
      getNamesCount: () => 0,
      getLabelsCount: () => 0,
    }, CaseHandling.CONDITIONALLY_CASE_SENSITIVE);
    expect(res.length).toBe(1);
    expect(res[0].tagId).toBe(20);
  });

  it("falls back to all when uppercase has no strict match", () => {
    const titleType = CompressionFlags.ORTH_ONLY_TITLE;
    const lowerType = CompressionFlags.ORTH_ONLY_LOWER;
    const viewTitle = makeGroupBuffer(titleType, minimalContent(titleType, 10));
    const viewLower = makeGroupBuffer(lowerType, minimalContent(lowerType, 20));
    const reader = new InterpsGroupsReader();
    const bytes = new Uint8Array(viewTitle.byteLength + viewLower.byteLength);
    bytes.set(new Uint8Array(viewTitle.buffer), 0);
    bytes.set(new Uint8Array(viewLower.buffer), viewTitle.byteLength);
    const combo = new DataView(bytes.buffer);
    reader.update(combo, 0, combo.byteLength);
    const dec = new InterpsGroupsDecoder();
    const res = dec.decode("WORD", reader, {
      getTagsetId: () => "",
      getTag: () => "",
      getTagId: () => 0,
      getName: () => "",
      getNameId: () => 0,
      getLabelsAsString: () => "",
      getLabels: () => new Set<string>(),
      getLabelsId: () => 0,
      getTagsCount: () => 0,
      getNamesCount: () => 0,
      getLabelsCount: () => 0,
    }, CaseHandling.CONDITIONALLY_CASE_SENSITIVE);
    expect(res.length).toBe(2);
    const tags = res.map(r => r.tagId).sort();
    expect(tags).toEqual([10, 20]);
  });
});
