import { describe, expect, it } from 'vitest';
import { parseDiagramFile, serializeDiagram } from '../../src/persistence/native-format.js';
import { applyCommand } from '../../src/domain/commands.js';
import {
  createAttribute,
  createDiagram,
  createEntity,
  createEntityLayout,
  createRelationship,
  createRelationshipEnd,
} from '../../src/domain/model.js';
import type { Diagram } from '../../src/domain/types.js';

function fixture(): Diagram {
  let diagram = createDiagram('Sales');
  diagram = applyCommand(diagram, {
    type: 'AddEntity',
    entity: createEntity({
      id: 'e1',
      name: 'Customer',
      attributes: [createAttribute({ id: 'a1', name: 'id', dataType: 'int', primaryKey: true })],
    }),
    layout: createEntityLayout({ x: 40, y: 60 }),
  });
  diagram = applyCommand(diagram, {
    type: 'AddEntity',
    entity: createEntity({ id: 'e2', name: 'Order', attributes: [] }),
    layout: createEntityLayout({ x: 400, y: 60 }),
  });
  diagram = applyCommand(diagram, {
    type: 'CreateRelationship',
    relationship: createRelationship(
      createRelationshipEnd('e1', { cardinality: 'one', optionality: 'mandatory' }),
      createRelationshipEnd('e2', { cardinality: 'many', optionality: 'optional' }),
      { id: 'r1', sourceLabel: 'places', targetLabel: 'placed by', identifying: true },
    ),
  });
  return diagram;
}

describe('native format', () => {
  it('round-trips a diagram', () => {
    const diagram = fixture();

    const restored = parseDiagramFile(serializeDiagram(diagram));

    expect(restored).toEqual(diagram);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseDiagramFile('{not json')).toThrow(/valid JSON/);
  });

  it('rejects a foreign format', () => {
    expect(() => parseDiagramFile(JSON.stringify({ format: 'other', diagram: {} }))).toThrow(
      /Unsupported file format/,
    );
  });

  it('rejects a newer format version', () => {
    const payload = { format: 'barkerish', formatVersion: 99, diagram: fixture() };
    expect(() => parseDiagramFile(JSON.stringify(payload))).toThrow(/newer version/);
  });

  it('rejects malformed entities', () => {
    const diagram = fixture() as unknown as Record<string, unknown>;
    (diagram['entities'] as Record<string, unknown>[])[0]!['name'] = 42;
    const payload = { format: 'barkerish', formatVersion: 1, diagram };

    expect(() => parseDiagramFile(JSON.stringify(payload))).toThrow(/must be a string/);
  });

  it('drops relationships that reference missing entities', () => {
    const diagram = fixture();
    diagram.relationships.push(
      createRelationship(createRelationshipEnd('e1'), createRelationshipEnd('ghost'), {
        id: 'r2',
      }),
    );

    const restored = parseDiagramFile(serializeDiagram(diagram));

    expect(restored.relationships.map((relationship) => relationship.id)).toEqual(['r1']);
  });

  it('supplies layout for entities that lack a position', () => {
    const diagram = fixture();
    delete diagram.layout.entities['e2'];

    const restored = parseDiagramFile(serializeDiagram(diagram));

    expect(restored.layout.entities['e2']).toEqual({ x: 380, y: 80, width: 220 });
  });
});
