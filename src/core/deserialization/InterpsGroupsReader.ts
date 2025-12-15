export interface InterpsGroup {
  type: number;
  ptr: number; // offset within backing buffer
  size: number;
}

/**
 * A lightweight view/iterator over interpretations group payload attached to accepting FSA states.
 * For now, store raw view boundaries; actual decode can happen in a separate decoder.
 */
export class InterpsGroupsReader {
  private _view: DataView | null = null;
  private _start = 0;
  private _size = 0;
  private _iter = 0;

  update(view: DataView, startOffset: number, size: number): void {
    this._view = view;
    this._start = startOffset;
    this._size = size;
    this._iter = 0;
  }

  hasNext(): boolean {
    return this._iter < this._size;
  }

  getNext(): InterpsGroup {
    if (!this._view) throw new Error('reader not initialized');
    if (!this.hasNext()) throw new RangeError('end of groups');
    // For scaffolding: treat each byte as a single group with that type
    const offset = this._start + this._iter;
    const type = this._view.getUint8(offset);
    this._iter += 1;
    return { type, ptr: offset, size: 1 };
  }
}
