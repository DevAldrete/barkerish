import { createEntityLayout, nextEntityPosition } from '../domain/model.js';
import { FORMAT_VERSION } from '../domain/types.js';
import type {
  Attribute,
  Cardinality,
  Diagram,
  Entity,
  EntityLayout,
  GridSettings,
  Layout,
  Optionality,
  Relationship,
  RelationshipEnd,
  Viewport,
} from '../domain/types.js';

export const NATIVE_FORMAT = 'barkerish';

export interface NativeFile {
  format: typeof NATIVE_FORMAT;
  formatVersion: number;
  diagram: Diagram;
}

export function serializeDiagram(diagram: Diagram): string {
  const file: NativeFile = {
    format: NATIVE_FORMAT,
    formatVersion: FORMAT_VERSION,
    diagram,
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Parse, migrate and validate a native file. Throws a descriptive Error when the
 * input is not a recognisable Barkerish diagram. The result is a freshly built
 * diagram, so unknown or extraneous fields are discarded.
 */
export function parseDiagramFile(text: string): Diagram {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }

  const file = asRecord(raw, 'file');
  if (file['format'] !== NATIVE_FORMAT) {
    throw new Error(`Unsupported file format: ${String(file['format'])}.`);
  }

  const version = asNumber(file['formatVersion'], 'file.formatVersion');
  if (version > FORMAT_VERSION) {
    throw new Error(
      `File was created by a newer version (${version}); this app supports up to ${FORMAT_VERSION}.`,
    );
  }

  const migrated = migrate(asRecord(file['diagram'], 'file.diagram'), version);
  return validateDiagram(migrated);
}

function migrate(raw: Record<string, unknown>, version: number): Record<string, unknown> {
  // No migrations are needed yet; v1 is the first format. Future versions should
  // transform older shapes here before validation.
  void version;
  return raw;
}

function validateDiagram(raw: Record<string, unknown>): Diagram {
  const entities = asArray(raw['entities'], 'diagram.entities').map(validateEntity);
  const entityIds = new Set(entities.map((entity) => entity.id));

  const layout = validateLayout(asRecord(raw['layout'], 'diagram.layout'), entities);

  const relationships = asArray(raw['relationships'], 'diagram.relationships')
    .map(validateRelationship)
    .filter((relationship) => {
      const valid =
        entityIds.has(relationship.source.entityId) && entityIds.has(relationship.target.entityId);
      return valid;
    });

  return {
    id: asString(raw['id'], 'diagram.id'),
    name: asString(raw['name'], 'diagram.name'),
    formatVersion: FORMAT_VERSION,
    entities,
    relationships,
    layout,
    createdAt: asString(raw['createdAt'], 'diagram.createdAt'),
    updatedAt: asString(raw['updatedAt'], 'diagram.updatedAt'),
  };
}

function validateEntity(raw: unknown, index: number): Entity {
  const record = asRecord(raw, `entities[${index}]`);
  return {
    id: asString(record['id'], `entities[${index}].id`),
    name: asString(record['name'], `entities[${index}].name`),
    attributes: asArray(record['attributes'], `entities[${index}].attributes`).map(
      validateAttribute,
    ),
  };
}

function validateAttribute(raw: unknown, index: number): Attribute {
  const record = asRecord(raw, `attribute[${index}]`);
  return {
    id: asString(record['id'], `attribute[${index}].id`),
    name: asString(record['name'], `attribute[${index}].name`),
    dataType: asString(record['dataType'], `attribute[${index}].dataType`),
    primaryKey: asBoolean(record['primaryKey'], `attribute[${index}].primaryKey`),
    foreignKey: asBoolean(record['foreignKey'], `attribute[${index}].foreignKey`),
    nullable: asBoolean(record['nullable'], `attribute[${index}].nullable`),
    unique: asBoolean(record['unique'], `attribute[${index}].unique`),
  };
}

function validateRelationship(raw: unknown, index: number): Relationship {
  const record = asRecord(raw, `relationships[${index}]`);
  return {
    id: asString(record['id'], `relationships[${index}].id`),
    sourceLabel: asString(record['sourceLabel'], `relationships[${index}].sourceLabel`),
    targetLabel: asString(record['targetLabel'], `relationships[${index}].targetLabel`),
    source: validateEnd(record['source'], `relationships[${index}].source`),
    target: validateEnd(record['target'], `relationships[${index}].target`),
    identifying: asBoolean(record['identifying'], `relationships[${index}].identifying`),
  };
}

function validateEnd(raw: unknown, path: string): RelationshipEnd {
  const record = asRecord(raw, path);
  return {
    entityId: asString(record['entityId'], `${path}.entityId`),
    optionality: asEnum<Optionality>(
      record['optionality'],
      ['mandatory', 'optional'],
      `${path}.optionality`,
    ),
    cardinality: asEnum<Cardinality>(record['cardinality'], ['one', 'many'], `${path}.cardinality`),
  };
}

function validateLayout(raw: Record<string, unknown>, entities: Entity[]): Layout {
  const rawEntities = asRecord(raw['entities'], 'layout.entities');
  const positions: Record<string, EntityLayout> = {};

  entities.forEach((entity, index) => {
    const entry = rawEntities[entity.id];
    positions[entity.id] = entry
      ? validateEntityLayout(entry, `layout.entities.${entity.id}`)
      : createEntityLayout(nextEntityPosition(index));
  });

  return {
    entities: positions,
    viewport: validateViewport(asRecord(raw['viewport'], 'layout.viewport')),
    grid: validateGrid(asRecord(raw['grid'], 'layout.grid')),
  };
}

function validateEntityLayout(raw: unknown, path: string): EntityLayout {
  const record = asRecord(raw, path);
  return {
    x: asNumber(record['x'], `${path}.x`),
    y: asNumber(record['y'], `${path}.y`),
    width: asNumber(record['width'], `${path}.width`),
  };
}

function validateViewport(raw: Record<string, unknown>): Viewport {
  return {
    x: asNumber(raw['x'], 'layout.viewport.x'),
    y: asNumber(raw['y'], 'layout.viewport.y'),
    zoom: asNumber(raw['zoom'], 'layout.viewport.zoom'),
  };
}

function validateGrid(raw: Record<string, unknown>): GridSettings {
  return {
    visible: asBoolean(raw['visible'], 'layout.grid.visible'),
    size: asNumber(raw['size'], 'layout.grid.size'),
    snap: asBoolean(raw['snap'], 'layout.grid.snap'),
  };
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array.`);
  }
  return value;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${path} must be a string.`);
  }
  return value;
}

function asNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number.`);
  }
  return value;
}

function asBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${path} must be a boolean.`);
  }
  return value;
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${path} must be one of ${allowed.join(', ')}.`);
  }
  return value as T;
}
