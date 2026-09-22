import { createId } from '../domain/ids.js';
import { createEmptyLayout, createEntityLayout, nextEntityPosition } from '../domain/model.js';
import { FORMAT_VERSION } from '../domain/types.js';
import type {
  Attribute,
  Diagram,
  Entity,
  EntityLayout,
  Relationship,
  RelationshipEnd,
} from '../domain/types.js';
import { DslError } from './ast.js';
import type { ParsedDiagram, ParsedEnd, ParsedEntity, ParsedRelationship } from './ast.js';

export interface CompileResult {
  diagram: Diagram;
  errors: DslError[];
}

/**
 * Build a domain diagram from a parsed diagram, reusing ids and layout from an
 * existing diagram where possible so that applying text does not disturb the
 * canvas. Entities and attributes are matched by stable key then by name;
 * relationships by key, then by endpoints and identifying flag.
 */
export function compileDiagram(
  parsed: ParsedDiagram,
  existing: Diagram | undefined,
  now = new Date().toISOString(),
): CompileResult {
  const errors: DslError[] = [];
  const entities = buildEntities(parsed, existing);
  const relationships = buildRelationships(parsed.relationships, entities, existing, errors);

  const layout = {
    entities: buildLayout(entities, existing),
    viewport: existing?.layout.viewport ?? createEmptyLayout().viewport,
    grid: existing?.layout.grid ?? createEmptyLayout().grid,
  };

  return {
    diagram: {
      id: existing?.id ?? createId(),
      name: parsed.name,
      formatVersion: FORMAT_VERSION,
      entities: entities.list,
      relationships,
      layout,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
    errors,
  };
}

interface EntityIndex {
  list: Entity[];
  byKey: Map<string, Entity>;
  byName: Map<string, Entity>;
}

function buildEntities(parsed: ParsedDiagram, existing: Diagram | undefined): EntityIndex {
  const existingEntities = existing?.entities ?? [];
  const existingById = new Map(existingEntities.map((entity) => [entity.id, entity]));
  const existingByName = groupByName(existingEntities);
  const usedIds = new Set<string>();

  const list: Entity[] = [];
  const byKey = new Map<string, Entity>();
  const byName = new Map<string, Entity>();

  for (const parsedEntity of parsed.entities) {
    const match = matchEntity(parsedEntity, existingById, existingByName, usedIds);
    const id = match?.id ?? createId();
    usedIds.add(id);

    const entity: Entity = {
      id,
      name: parsedEntity.name,
      attributes: buildAttributes(parsedEntity, match?.attributes ?? []),
    };
    list.push(entity);

    if (parsedEntity.key && !byKey.has(parsedEntity.key)) {
      byKey.set(parsedEntity.key, entity);
    }
    if (!byName.has(parsedEntity.name)) {
      byName.set(parsedEntity.name, entity);
    }
  }

  return { list, byKey, byName };
}

function matchEntity(
  parsed: ParsedEntity,
  existingById: Map<string, Entity>,
  existingByName: Map<string, Entity[]>,
  usedIds: Set<string>,
): Entity | undefined {
  if (parsed.key) {
    const byKey = existingById.get(parsed.key);
    if (byKey && !usedIds.has(byKey.id)) {
      return byKey;
    }
  }
  const candidates = existingByName.get(parsed.name) ?? [];
  return candidates.find((entity) => !usedIds.has(entity.id));
}

function buildAttributes(parsed: ParsedEntity, existing: Attribute[]): Attribute[] {
  const existingByName = groupByName(existing);
  const usedIds = new Set<string>();

  return parsed.attributes.map((parsedAttribute) => {
    const candidates = existingByName.get(parsedAttribute.name) ?? [];
    const match = candidates.find((attribute) => !usedIds.has(attribute.id));
    const id = match?.id ?? createId();
    usedIds.add(id);

    return {
      id,
      name: parsedAttribute.name,
      dataType: parsedAttribute.dataType,
      primaryKey: parsedAttribute.primaryKey,
      foreignKey: parsedAttribute.foreignKey,
      nullable: parsedAttribute.nullable,
      unique: parsedAttribute.unique,
    };
  });
}

function buildRelationships(
  parsed: ParsedRelationship[],
  entities: EntityIndex,
  existing: Diagram | undefined,
  errors: DslError[],
): Relationship[] {
  const existingRelationships = existing?.relationships ?? [];
  const existingById = new Map(
    existingRelationships.map((relationship) => [relationship.id, relationship]),
  );
  const usedIds = new Set<string>();
  const relationships: Relationship[] = [];

  for (const parsedRelationship of parsed) {
    const source = resolveEnd(parsedRelationship.source, entities, errors);
    const target = resolveEnd(parsedRelationship.target, entities, errors);
    if (!source || !target) {
      continue;
    }
    if (source.entityId === target.entityId) {
      errors.push(new DslError(0, 0, 'Self-referencing relationships are not supported yet.'));
      continue;
    }

    const match = matchRelationship(
      parsedRelationship,
      source,
      target,
      existingById,
      existingRelationships,
      usedIds,
    );
    const id = match?.id ?? createId();
    usedIds.add(id);

    relationships.push({
      id,
      sourceLabel: parsedRelationship.sourceLabel,
      targetLabel: parsedRelationship.targetLabel,
      source,
      target,
      identifying: parsedRelationship.identifying,
    });
  }

  return relationships;
}

function matchRelationship(
  parsed: ParsedRelationship,
  source: RelationshipEnd,
  target: RelationshipEnd,
  existingById: Map<string, Relationship>,
  existingRelationships: Relationship[],
  usedIds: Set<string>,
): Relationship | undefined {
  if (parsed.key) {
    const byKey = existingById.get(parsed.key);
    if (byKey && !usedIds.has(byKey.id)) {
      return byKey;
    }
  }
  return existingRelationships.find(
    (relationship) =>
      !usedIds.has(relationship.id) &&
      relationship.source.entityId === source.entityId &&
      relationship.target.entityId === target.entityId &&
      relationship.identifying === parsed.identifying,
  );
}

function resolveEnd(
  end: ParsedEnd,
  entities: EntityIndex,
  errors: DslError[],
): RelationshipEnd | undefined {
  const entity = entities.byKey.get(end.entity) ?? entities.byName.get(end.entity);
  if (!entity) {
    errors.push(new DslError(0, 0, `Unknown entity '${end.entity}' referenced by a relationship.`));
    return undefined;
  }
  return {
    entityId: entity.id,
    optionality: end.optionality,
    cardinality: end.cardinality,
  };
}

function buildLayout(
  entities: EntityIndex,
  existing: Diagram | undefined,
): Record<string, EntityLayout> {
  const layout: Record<string, EntityLayout> = {};
  entities.list.forEach((entity, index) => {
    const previous = existing?.layout.entities[entity.id];
    layout[entity.id] = previous ? { ...previous } : createEntityLayout(nextEntityPosition(index));
  });
  return layout;
}

function groupByName<T extends { name: string }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.name) ?? [];
    list.push(item);
    groups.set(item.name, list);
  }
  return groups;
}
