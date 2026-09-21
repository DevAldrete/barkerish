import type { Id } from './ids.js';
import type {
  Attribute,
  Diagram,
  Entity,
  EntityLayout,
  GridSettings,
  Relationship,
  Viewport,
} from './types.js';

export type AttributePatch = Partial<Omit<Attribute, 'id'>>;
export type RelationshipPatch = Partial<Omit<Relationship, 'id'>>;

/**
 * Semantic editing operations. Commands are plain, serializable descriptors and
 * are applied by a pure reducer, which keeps them easy to test, log, and replay.
 */
export type Command =
  | { type: 'AddEntity'; entity: Entity; layout: EntityLayout }
  | { type: 'DeleteEntity'; entityId: Id }
  | { type: 'RenameEntity'; entityId: Id; name: string }
  | { type: 'MoveEntity'; entityId: Id; x: number; y: number }
  | { type: 'ResizeEntity'; entityId: Id; width: number }
  | { type: 'AddAttribute'; entityId: Id; attribute: Attribute; index?: number }
  | { type: 'UpdateAttribute'; entityId: Id; attributeId: Id; patch: AttributePatch }
  | { type: 'DeleteAttribute'; entityId: Id; attributeId: Id }
  | { type: 'ReorderAttribute'; entityId: Id; attributeId: Id; toIndex: number }
  | { type: 'CreateRelationship'; relationship: Relationship }
  | { type: 'UpdateRelationship'; relationshipId: Id; patch: RelationshipPatch }
  | { type: 'DeleteRelationship'; relationshipId: Id }
  | { type: 'RenameDiagram'; name: string }
  | { type: 'SetViewport'; viewport: Viewport }
  | { type: 'SetGrid'; patch: Partial<GridSettings> };

/**
 * Apply a command, returning a new diagram. Pure and deterministic: it never
 * mutates the input and never touches timestamps. Returns the same reference when
 * the command is a no-op, which lets callers cheaply skip redundant work.
 */
export function applyCommand(diagram: Diagram, command: Command): Diagram {
  switch (command.type) {
    case 'AddEntity':
      return {
        ...diagram,
        entities: [...diagram.entities, command.entity],
        layout: {
          ...diagram.layout,
          entities: {
            ...diagram.layout.entities,
            [command.entity.id]: command.layout,
          },
        },
      };

    case 'DeleteEntity':
      return deleteEntity(diagram, command.entityId);

    case 'RenameEntity':
      return updateEntity(diagram, command.entityId, (entity) => ({
        ...entity,
        name: command.name,
      }));

    case 'MoveEntity':
      return updateEntityLayout(diagram, command.entityId, (layout) => ({
        ...layout,
        x: command.x,
        y: command.y,
      }));

    case 'ResizeEntity':
      return updateEntityLayout(diagram, command.entityId, (layout) => ({
        ...layout,
        width: command.width,
      }));

    case 'AddAttribute':
      return updateEntity(diagram, command.entityId, (entity) => {
        const attributes = [...entity.attributes];
        const index = clamp(command.index ?? attributes.length, 0, attributes.length);
        attributes.splice(index, 0, command.attribute);
        return { ...entity, attributes };
      });

    case 'UpdateAttribute':
      return updateEntity(diagram, command.entityId, (entity) => ({
        ...entity,
        attributes: entity.attributes.map((attribute) =>
          attribute.id === command.attributeId ? { ...attribute, ...command.patch } : attribute,
        ),
      }));

    case 'DeleteAttribute':
      return updateEntity(diagram, command.entityId, (entity) => ({
        ...entity,
        attributes: entity.attributes.filter((attribute) => attribute.id !== command.attributeId),
      }));

    case 'ReorderAttribute':
      return updateEntity(diagram, command.entityId, (entity) =>
        reorderAttribute(entity, command.attributeId, command.toIndex),
      );

    case 'CreateRelationship':
      return {
        ...diagram,
        relationships: [...diagram.relationships, command.relationship],
      };

    case 'UpdateRelationship':
      return {
        ...diagram,
        relationships: diagram.relationships.map((relationship) =>
          relationship.id === command.relationshipId
            ? { ...relationship, ...command.patch }
            : relationship,
        ),
      };

    case 'DeleteRelationship':
      return {
        ...diagram,
        relationships: diagram.relationships.filter(
          (relationship) => relationship.id !== command.relationshipId,
        ),
      };

    case 'RenameDiagram':
      return { ...diagram, name: command.name };

    case 'SetViewport':
      return { ...diagram, layout: { ...diagram.layout, viewport: command.viewport } };

    case 'SetGrid':
      return {
        ...diagram,
        layout: { ...diagram.layout, grid: { ...diagram.layout.grid, ...command.patch } },
      };
  }
}

function deleteEntity(diagram: Diagram, entityId: Id): Diagram {
  if (!diagram.entities.some((entity) => entity.id === entityId)) {
    return diagram;
  }

  const entitiesLayout = { ...diagram.layout.entities };
  delete entitiesLayout[entityId];

  return {
    ...diagram,
    entities: diagram.entities.filter((entity) => entity.id !== entityId),
    relationships: diagram.relationships.filter(
      (relationship) =>
        relationship.source.entityId !== entityId && relationship.target.entityId !== entityId,
    ),
    layout: { ...diagram.layout, entities: entitiesLayout },
  };
}

function updateEntity(diagram: Diagram, entityId: Id, update: (entity: Entity) => Entity): Diagram {
  let changed = false;
  const entities = diagram.entities.map((entity) => {
    if (entity.id !== entityId) {
      return entity;
    }
    changed = true;
    return update(entity);
  });

  return changed ? { ...diagram, entities } : diagram;
}

function updateEntityLayout(
  diagram: Diagram,
  entityId: Id,
  update: (layout: EntityLayout) => EntityLayout,
): Diagram {
  const current = diagram.layout.entities[entityId];
  if (!current) {
    return diagram;
  }

  return {
    ...diagram,
    layout: {
      ...diagram.layout,
      entities: {
        ...diagram.layout.entities,
        [entityId]: update(current),
      },
    },
  };
}

function reorderAttribute(entity: Entity, attributeId: Id, toIndex: number): Entity {
  const from = entity.attributes.findIndex((attribute) => attribute.id === attributeId);
  if (from < 0) {
    return entity;
  }

  const attributes = [...entity.attributes];
  const [moved] = attributes.splice(from, 1);
  if (!moved) {
    return entity;
  }

  attributes.splice(clamp(toIndex, 0, attributes.length), 0, moved);
  return { ...entity, attributes };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
