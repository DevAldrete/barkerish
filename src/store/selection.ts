import type { Id } from '../domain/ids.js';

export type Selection = { kind: 'entity'; id: Id } | { kind: 'relationship'; id: Id } | null;

export function entitySelected(selection: Selection, entityId: Id): boolean {
  return selection?.kind === 'entity' && selection.id === entityId;
}

export function relationshipSelected(selection: Selection, relationshipId: Id): boolean {
  return selection?.kind === 'relationship' && selection.id === relationshipId;
}
