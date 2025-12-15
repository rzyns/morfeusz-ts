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

export class SimpleState<T> implements State<T> {
  private sink = false;
  private accepting = false;
  private value!: T;
  private valueSize = 0;
  isSink(): boolean { return this.sink; }
  isAccepting(): boolean { return this.accepting; }
  proceedToNext(_fsa: FSA<T>, _c: number): void { /* placeholder */ }
  getValue(): T { if (!this.accepting) throw new Error('not accepting'); return this.value; }
  getValueSize(): number { return this.valueSize; }
  setSink(): void { this.sink = true; this.accepting = false; }
  setAccepting(value: T, size: number): void { this.accepting = true; this.value = value; this.valueSize = size; }
}

export class SimpleFSA<T> implements FSA<T> {
  constructor(private readonly initial: State<T>) {}
  getInitialState(): State<T> { return this.initial; }
}
