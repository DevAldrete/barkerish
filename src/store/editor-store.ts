import { applyCommand } from '../domain/commands.js';
import type { Command } from '../domain/commands.js';
import type { Diagram } from '../domain/types.js';
import { UndoStack } from './history.js';
import type { Selection } from './selection.js';

export interface CommitOptions {
  /** Collapse consecutive commands sharing a key into one undo entry. */
  coalesceKey?: string;
  /** When false, the change is not recorded in undo/redo (e.g. viewport). */
  history?: boolean;
}

/**
 * Owns the current document, selection and undo history. Every mutation flows
 * through {@link dispatch}, which keeps undo/redo and change notification in one
 * place. It is UI-agnostic; components observe it through change events.
 */
export class EditorStore extends EventTarget {
  #history: UndoStack<Diagram>;
  #selection: Selection = null;
  #dirty = false;

  constructor(diagram: Diagram) {
    super();
    this.#history = new UndoStack(diagram);
  }

  get diagram(): Diagram {
    return this.#history.present;
  }

  get selection(): Selection {
    return this.#selection;
  }

  get canUndo(): boolean {
    return this.#history.canUndo;
  }

  get canRedo(): boolean {
    return this.#history.canRedo;
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  dispatch(command: Command, options: CommitOptions = {}): void {
    const next = applyCommand(this.diagram, command);
    if (next === this.diagram) {
      return;
    }

    if (options.history === false) {
      this.#history.replace(next);
    } else {
      this.#history.push(next, { coalesceKey: options.coalesceKey });
    }

    this.#dirty = true;
    this.#pruneSelection();
    this.#emit();
  }

  undo(): void {
    if (this.#history.undo() === undefined) {
      return;
    }
    this.#dirty = true;
    this.#pruneSelection();
    this.#emit();
  }

  redo(): void {
    if (this.#history.redo() === undefined) {
      return;
    }
    this.#dirty = true;
    this.#pruneSelection();
    this.#emit();
  }

  select(selection: Selection): void {
    this.#selection = selection;
    this.#emit();
  }

  /** Finish a coalesced interaction (e.g. pointer up after dragging). */
  endInteraction(): void {
    this.#history.endCoalescing();
  }

  load(diagram: Diagram): void {
    this.#history = new UndoStack(diagram);
    this.#selection = null;
    this.#dirty = false;
    this.#emit();
  }

  markSaved(): void {
    if (!this.#dirty) {
      return;
    }
    this.#dirty = false;
    this.#emit();
  }

  #pruneSelection(): void {
    const selection = this.#selection;
    if (!selection) {
      return;
    }

    const exists =
      selection.kind === 'entity'
        ? this.diagram.entities.some((entity) => entity.id === selection.id)
        : this.diagram.relationships.some((relationship) => relationship.id === selection.id);

    if (!exists) {
      this.#selection = null;
    }
  }

  #emit(): void {
    this.dispatchEvent(new Event('change'));
  }
}
