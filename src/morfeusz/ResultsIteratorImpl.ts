import type { ResultsIterator, MorphInterpretation } from "../core/types.js";

export class ResultsIteratorImpl implements ResultsIterator {
  private readonly items: MorphInterpretation[];
  private idx = 0;

  constructor(items: MorphInterpretation[]) {
    this.items = items;
  }

  hasNext(): boolean {
    return this.idx < this.items.length;
  }

  peek(): MorphInterpretation {
    if (!this.hasNext()) throw new RangeError("Iterator exhausted");
    return this.items[this.idx];
  }

  next(): MorphInterpretation {
    if (!this.hasNext()) throw new RangeError("Iterator exhausted");
    return this.items[this.idx++];
  }
}
