import {
  createAttribute,
  createEntity,
  createEntityLayout,
  nextEntityPosition,
} from '../domain/model.js';
import type { EditorStore } from './editor-store.js';

/** Application services: the operations the UI can invoke on the editor. */

export function addEntity(store: EditorStore): string {
  const position = nextEntityPosition(store.diagram.entities.length);
  const entity = createEntity();

  store.dispatch({
    type: 'AddEntity',
    entity,
    layout: createEntityLayout(position),
  });
  store.select({ kind: 'entity', id: entity.id });

  return entity.id;
}

export function addAttribute(store: EditorStore, entityId: string): void {
  if (!store.diagram.entities.some((entity) => entity.id === entityId)) {
    return;
  }
  store.dispatch({ type: 'AddAttribute', entityId, attribute: createAttribute() });
}

export function deleteSelection(store: EditorStore): void {
  const selection = store.selection;
  if (!selection) {
    return;
  }

  if (selection.kind === 'entity') {
    store.dispatch({ type: 'DeleteEntity', entityId: selection.id });
  } else {
    store.dispatch({ type: 'DeleteRelationship', relationshipId: selection.id });
  }
}
