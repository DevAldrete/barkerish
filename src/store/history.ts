export interface PushOptions {
  /**
   * When the same key is pushed consecutively, the present is replaced instead of
   * recording a new undo step. Used to collapse a drag into a single history entry.
   * Call {@link UndoStack.endCoalescing} when the interaction finishes.
   */
  coalesceKey?: string;
}

/**
 * Bounded, snapshot-based undo/redo. Diagrams are small, so keeping whole states is
 * simpler and far less error-prone than maintaining inverse operations.
 */
export class UndoStack<T> {
  #past: T[] = [];
  #future: T[] = [];
  #present: T;
  #limit: number;
  #coalesceKey: string | null = null;

  constructor(initial: T, limit = 100) {
    this.#present = initial;
    this.#limit = Math.max(1, limit);
  }

  get present(): T {
    return this.#present;
  }

  get canUndo(): boolean {
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
  }

  get undoDepth(): number {
    return this.#past.length;
  }

  get redoDepth(): number {
    return this.#future.length;
  }

  push(next: T, options: PushOptions = {}): void {
    if (options.coalesceKey !== undefined && options.coalesceKey === this.#coalesceKey) {
      this.#present = next;
      this.#future = [];
      return;
    }

    this.#past.push(this.#present);
    if (this.#past.length > this.#limit) {
      this.#past.shift();
    }
    this.#present = next;
    this.#future = [];
    this.#coalesceKey = options.coalesceKey ?? null;
  }

  endCoalescing(): void {
    this.#coalesceKey = null;
  }

  undo(): T | undefined {
    const previous = this.#past.pop();
    if (previous === undefined) {
      return undefined;
    }
    this.#future.push(this.#present);
    this.#present = previous;
    this.#coalesceKey = null;
    return previous;
  }

  redo(): T | undefined {
    const next = this.#future.pop();
    if (next === undefined) {
      return undefined;
    }
    this.#past.push(this.#present);
    this.#present = next;
    this.#coalesceKey = null;
    return next;
  }

  clear(): void {
    this.#past = [];
    this.#future = [];
    this.#coalesceKey = null;
  }
}
