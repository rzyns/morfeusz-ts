export interface Deserializer<T> {
  deserialize(view: DataView, offset: number, out: T): number; // bytes consumed
}

export interface State<T> {
  isSink(): boolean;
  isAccepting(): boolean;
  proceedToNext(fsa: FSA<T>, c: number): void;
  getValue(): T;
  getValueSize(): number;
}

export interface FSA<T> {
  getInitialState(): State<T>;
}

// A minimal generic FSA interface and a concrete SimpleFSA implementation
// matching morfeusz "simple" FSA layout used in .dict files.

class SimpleFsaState<T> implements State<T> {
  private sink = false;
  private accepting = false;
  private value!: T;
  private valueSize = 0;
  constructor(public offset: number) {}
  isSink(): boolean { return this.sink; }
  isAccepting(): boolean { return this.accepting; }
  proceedToNext(fsa: FSA<T>, c: number): void {
    (fsa as SimpleFSA<T>).proceedToNextInternal(this, c);
  }
  getValue(): T { if (!this.accepting) throw new Error('not accepting'); return this.value; }
  getValueSize(): number { return this.valueSize; }
  setNext(offset: number): void { this.sink = false; this.accepting = false; this.offset = offset; this.valueSize = 0; }
  setNextAccepting(offset: number, value: T, size: number): void { this.sink = false; this.accepting = true; this.offset = offset; this.value = value; this.valueSize = size; }
  setSink(): void { this.sink = true; this.accepting = false; this.valueSize = 0; }
}

export class SimpleFSA<T> implements FSA<T> {
  private static readonly ACCEPTING_FLAG = 0x80;
  private static readonly TRANSITIONS_NUM_MASK = 0x7f;
  constructor(
    private readonly view: DataView,
    private readonly deserializer: Deserializer<T>,
    private readonly outFactory: () => T,
    private readonly isTransducer: boolean = false
  ) {}
  getInitialState(): State<T> { return new SimpleFsaState<T>(0); }
  proceedToNextInternal(state: SimpleFsaState<T>, c: number): void {
    if (state.isSink()) return;
    const from = state.offset >>> 0;
    let transitionsTableOffset = 1; // skip stateData byte
    if (state.isAccepting()) transitionsTableOffset += state.getValueSize();
    const stateData = this.view.getUint8(from);
    const transitionsNum = stateData & SimpleFSA.TRANSITIONS_NUM_MASK;
    const inc = this.isTransducer ? 5 : 4;
    const labelToFind = c & 0xff;
    let foundPos = -1;
    let pos = from + transitionsTableOffset;
    for (let i = 0; i < transitionsNum; i++, pos += inc) {
      const label = this.view.getUint8(pos);
      if (label === labelToFind) { foundPos = pos; break; }
    }
    if (foundPos < 0) { state.setSink(); return; }
    const offset = ((this.view.getUint8(foundPos + 1) << 16) | (this.view.getUint8(foundPos + 2) << 8) | (this.view.getUint8(foundPos + 3))) >>> 0;
    const nextPtr = offset;
    const nextStateData = this.view.getUint8(nextPtr);
    const nextAccepting = (nextStateData & SimpleFSA.ACCEPTING_FLAG) !== 0;
    if (nextAccepting) {
      const out = this.outFactory();
      const consumed = this.deserializer.deserialize(this.view, nextPtr + 1, out);
      state.setNextAccepting(nextPtr, out, consumed);
    } else {
      state.setNext(nextPtr);
    }
  }
}
