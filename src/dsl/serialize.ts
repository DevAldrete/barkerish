import type {
  Attribute,
  Cardinality,
  Diagram,
  Entity,
  Optionality,
  Relationship,
} from '../domain/types.js';

const RESERVED = new Set([
  'diagram',
  'entity',
  'relationship',
  'pk',
  'fk',
  'unique',
  'null',
  'not',
  'identifying',
]);

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Serialize diagrams to DSL text. Output is deterministic: diagrams, entities,
 * attributes and relationships keep their array order, and every diagram, entity
 * and relationship carries a stable key so the text round-trips across renames.
 */
export function serializeDocument(diagrams: Diagram[]): string {
  if (diagrams.length === 0) {
    return '';
  }
  return `${diagrams.map(serializeDiagram).join('\n\n')}\n`;
}

function serializeDiagram(diagram: Diagram): string {
  const nameById = new Map(diagram.entities.map((entity) => [entity.id, entity.name]));
  const lines: string[] = [`diagram ${formatName(diagram.name)} [${diagram.id}] {`];

  if (diagram.entities.length > 0) {
    lines.push(...diagram.entities.map(serializeEntity));
  }
  if (diagram.entities.length > 0 && diagram.relationships.length > 0) {
    lines.push('');
  }
  if (diagram.relationships.length > 0) {
    lines.push(
      ...diagram.relationships.map((relationship) => serializeRelationship(relationship, nameById)),
    );
  }

  lines.push('}');
  return lines.join('\n');
}

function serializeEntity(entity: Entity): string {
  const lines: string[] = [`  entity ${formatName(entity.name)} [${entity.id}] {`];
  lines.push(...entity.attributes.map((attribute) => `    ${serializeAttribute(attribute)}`));
  lines.push('  }');
  return lines.join('\n');
}

function serializeAttribute(attribute: Attribute): string {
  const parts = [`${formatName(attribute.name)}:`];
  if (attribute.dataType) {
    parts.push(attribute.dataType);
  }
  if (attribute.primaryKey) {
    parts.push('pk');
  }
  if (attribute.foreignKey) {
    parts.push('fk');
  }
  if (attribute.unique) {
    parts.push('unique');
  }
  if (!attribute.nullable) {
    parts.push('not null');
  }
  return parts.join(' ');
}

function serializeRelationship(relationship: Relationship, nameById: Map<string, string>): string {
  const source = nameById.get(relationship.source.entityId) ?? 'unknown';
  const target = nameById.get(relationship.target.entityId) ?? 'unknown';

  let line = `  relationship [${relationship.id}] ${formatName(source)} ${formatRange(
    relationship.source.optionality,
    relationship.source.cardinality,
  )} -> ${formatName(target)} ${formatRange(
    relationship.target.optionality,
    relationship.target.cardinality,
  )}`;

  const labels = `"${escapeString(relationship.sourceLabel)}" / "${escapeString(relationship.targetLabel)}"`;
  if (relationship.sourceLabel !== 'relates to' || relationship.targetLabel !== 'relates to') {
    line += ` : ${labels}`;
  }
  if (relationship.identifying) {
    line += ' identifying';
  }
  return line;
}

function formatRange(optionality: Optionality, cardinality: Cardinality): string {
  const min = optionality === 'mandatory' ? '1' : '0';
  const max = cardinality === 'many' ? '*' : '1';
  return `(${min}..${max})`;
}

function formatName(name: string): string {
  if (IDENTIFIER.test(name) && !RESERVED.has(name)) {
    return name;
  }
  return `"${escapeString(name)}"`;
}

function escapeString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
