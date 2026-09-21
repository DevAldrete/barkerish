import { createId } from './ids.js';
import { FORMAT_VERSION } from './types.js';
import type {
  Attribute,
  Diagram,
  Entity,
  EntityLayout,
  Layout,
  Relationship,
  RelationshipEnd,
  Viewport,
} from './types.js';

export const DEFAULT_ENTITY_WIDTH = 220;
export const DEFAULT_GRID_SIZE = 20;
export const DEFAULT_ZOOM = 1;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 4;

const PLACEMENT_ORIGIN = 80;
const PLACEMENT_STEP_X = DEFAULT_ENTITY_WIDTH + 80;
const PLACEMENT_STEP_Y = 220;
const PLACEMENT_COLUMNS = 4;

export function createAttribute(input: Partial<Attribute> = {}): Attribute {
  return {
    id: input.id ?? createId(),
    name: input.name ?? 'new_attribute',
    dataType: input.dataType ?? '',
    primaryKey: input.primaryKey ?? false,
    foreignKey: input.foreignKey ?? false,
    nullable: input.nullable ?? true,
    unique: input.unique ?? false,
  };
}

export function createEntity(input: Partial<Entity> = {}): Entity {
  return {
    id: input.id ?? createId(),
    name: input.name ?? 'New_Entity',
    attributes: input.attributes ?? [
      createAttribute({ name: 'id', dataType: 'integer', primaryKey: true, nullable: false }),
    ],
  };
}

export function createRelationshipEnd(
  entityId: string,
  input: Partial<Omit<RelationshipEnd, 'entityId'>> = {},
): RelationshipEnd {
  return {
    entityId,
    optionality: input.optionality ?? 'optional',
    cardinality: input.cardinality ?? 'many',
  };
}

export function createRelationship(
  source: RelationshipEnd,
  target: RelationshipEnd,
  input: Partial<Omit<Relationship, 'source' | 'target'>> = {},
): Relationship {
  return {
    id: input.id ?? createId(),
    sourceLabel: input.sourceLabel ?? 'relates to',
    targetLabel: input.targetLabel ?? 'relates to',
    source,
    target,
    identifying: input.identifying ?? false,
  };
}

export function createViewport(): Viewport {
  return { x: 0, y: 0, zoom: DEFAULT_ZOOM };
}

export function createEmptyLayout(): Layout {
  return {
    entities: {},
    viewport: createViewport(),
    grid: { visible: true, size: DEFAULT_GRID_SIZE, snap: false },
  };
}

/**
 * Cascade new entities left-to-right, wrapping into rows so they do not stack
 * exactly on top of each other.
 */
export function nextEntityPosition(existingCount: number): { x: number; y: number } {
  const column = existingCount % PLACEMENT_COLUMNS;
  const row = Math.floor(existingCount / PLACEMENT_COLUMNS);
  return {
    x: PLACEMENT_ORIGIN + column * PLACEMENT_STEP_X,
    y: PLACEMENT_ORIGIN + row * PLACEMENT_STEP_Y,
  };
}

export function createEntityLayout(position: { x: number; y: number }): EntityLayout {
  return { x: position.x, y: position.y, width: DEFAULT_ENTITY_WIDTH };
}

export function createDiagram(name = 'Untitled Diagram'): Diagram {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name,
    formatVersion: FORMAT_VERSION,
    entities: [],
    relationships: [],
    layout: createEmptyLayout(),
    createdAt: now,
    updatedAt: now,
  };
}

export function findEntity(diagram: Diagram, entityId: string): Entity | undefined {
  return diagram.entities.find((entity) => entity.id === entityId);
}

export function findRelationship(
  diagram: Diagram,
  relationshipId: string,
): Relationship | undefined {
  return diagram.relationships.find((relationship) => relationship.id === relationshipId);
}

export function relationshipsForEntity(diagram: Diagram, entityId: string): Relationship[] {
  return diagram.relationships.filter(
    (relationship) =>
      relationship.source.entityId === entityId || relationship.target.entityId === entityId,
  );
}
