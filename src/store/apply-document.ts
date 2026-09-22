import type { Diagram, DiagramMeta } from '../domain/types.js';
import { parseDocument, reconcileDocument } from '../dsl/index.js';
import type { DslError } from '../dsl/index.js';
import type { DocumentManager } from './document-manager.js';
import type { EditorStore } from './editor-store.js';

/** A preview of what applying a text document would do. */
export interface DocumentPlan {
  /** Diagrams to create or update, in source order. */
  diagrams: Diagram[];
  /** Existing diagrams that the text does not mention and would be deleted. */
  removed: Diagram[];
  errors: DslError[];
}

export interface ApplyDocumentResult {
  applied: Diagram[];
  removed: DiagramMeta[];
}

/**
 * Parse a DSL document and work out what applying it would change, without
 * touching storage. The caller can inspect `errors` and `removed` (e.g. to ask
 * for confirmation) before committing with {@link applyDocument}.
 */
export async function planDocument(
  text: string,
  manager: DocumentManager,
  now = new Date().toISOString(),
): Promise<DocumentPlan> {
  const { document, errors } = parseDocument(text);
  if (errors.length > 0) {
    return { diagrams: [], removed: [], errors };
  }

  const existing = await manager.loadAll();
  const reconciled = reconcileDocument(document, existing, now);
  return {
    diagrams: reconciled.diagrams,
    removed: reconciled.removed,
    errors: reconciled.errors,
  };
}

/**
 * Commit a plan. The currently open diagram goes through the undoable store;
 * other diagrams are saved directly. Diagrams absent from the document are
 * deleted (the text is a full mirror of the saved diagrams).
 */
export async function applyDocument(
  plan: DocumentPlan,
  manager: DocumentManager,
  store: EditorStore,
): Promise<ApplyDocumentResult> {
  const currentId = manager.currentId;

  for (const diagram of plan.diagrams) {
    if (diagram.id === currentId) {
      store.dispatch({
        type: 'ReplaceModel',
        name: diagram.name,
        entities: diagram.entities,
        relationships: diagram.relationships,
        layout: diagram.layout,
      });
    } else {
      await manager.save(diagram);
    }
  }

  const removed: DiagramMeta[] = plan.removed.map((diagram) => ({
    id: diagram.id,
    name: diagram.name,
    createdAt: diagram.createdAt,
    updatedAt: diagram.updatedAt,
  }));

  for (const meta of removed) {
    await manager.remove(meta.id);
  }

  await manager.refresh();

  return { applied: plan.diagrams, removed };
}
