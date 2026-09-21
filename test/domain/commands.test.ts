import { describe, expect, it } from 'vitest';
import { applyCommand } from '../../src/domain/commands.js';
import {
  createAttribute,
  createDiagram,
  createEntity,
  createEntityLayout,
  createRelationship,
  createRelationshipEnd,
} from '../../src/domain/model.js';
import type { Command } from '../../src/domain/commands.js';
import type { Diagram } from '../../src/domain/types.js';

function addEntity(id: string, name: string, x: number, y: number): Command {
  return {
    type: 'AddEntity',
    entity: createEntity({
      id,
      name,
      attributes: [
        createAttribute({ id: `${id}-pk`, name: 'id', primaryKey: true, nullable: false }),
      ],
    }),
    layout: createEntityLayout({ x, y }),
  };
}

function fixture(): Diagram {
  let diagram = createDiagram('Test');
  diagram = applyCommand(diagram, addEntity('e1', 'Customer', 0, 0));
  diagram = applyCommand(diagram, addEntity('e2', 'Order', 300, 0));
  return diagram;
}

function relationshipCommand(id = 'r1'): Command {
  return {
    type: 'CreateRelationship',
    relationship: createRelationship(
      createRelationshipEnd('e1', { cardinality: 'one', optionality: 'mandatory' }),
      createRelationshipEnd('e2', { cardinality: 'many', optionality: 'optional' }),
      { id, sourceLabel: 'a placer of', targetLabel: 'placed by' },
    ),
  };
}

describe('applyCommand', () => {
  it('adds an entity together with its layout', () => {
    const diagram = applyCommand(createDiagram(), addEntity('e1', 'A', 40, 60));

    expect(diagram.entities).toHaveLength(1);
    expect(diagram.layout.entities['e1']).toEqual({ x: 40, y: 60, width: 220 });
  });

  it('does not mutate the input diagram', () => {
    const diagram = fixture();
    const before = structuredClone(diagram);

    applyCommand(diagram, { type: 'RenameEntity', entityId: 'e1', name: 'Client' });

    expect(diagram).toEqual(before);
  });

  it('renames an entity', () => {
    const diagram = applyCommand(fixture(), {
      type: 'RenameEntity',
      entityId: 'e1',
      name: 'Client',
    });

    expect(diagram.entities.find((entity) => entity.id === 'e1')?.name).toBe('Client');
  });

  it('moves and resizes an entity', () => {
    let diagram = applyCommand(fixture(), { type: 'MoveEntity', entityId: 'e1', x: 5, y: 6 });
    diagram = applyCommand(diagram, { type: 'ResizeEntity', entityId: 'e1', width: 300 });

    expect(diagram.layout.entities['e1']).toEqual({ x: 5, y: 6, width: 300 });
  });

  it('deletes an entity, its layout and its relationships', () => {
    let diagram = applyCommand(fixture(), relationshipCommand());
    diagram = applyCommand(diagram, { type: 'DeleteEntity', entityId: 'e1' });

    expect(diagram.entities.map((entity) => entity.id)).toEqual(['e2']);
    expect(diagram.layout.entities['e1']).toBeUndefined();
    expect(diagram.relationships).toEqual([]);
  });

  it('adds attributes at the requested index or at the end', () => {
    let diagram = fixture();
    const atEnd = createAttribute({ id: 'a2', name: 'email' });
    diagram = applyCommand(diagram, { type: 'AddAttribute', entityId: 'e1', attribute: atEnd });
    diagram = applyCommand(diagram, {
      type: 'AddAttribute',
      entityId: 'e1',
      attribute: createAttribute({ id: 'a0', name: 'code' }),
      index: 0,
    });

    expect(diagram.entities[0]?.attributes.map((attribute) => attribute.id)).toEqual([
      'a0',
      'e1-pk',
      'a2',
    ]);
  });

  it('updates and deletes attributes', () => {
    let diagram = applyCommand(fixture(), {
      type: 'UpdateAttribute',
      entityId: 'e1',
      attributeId: 'e1-pk',
      patch: { nullable: true, unique: true },
    });
    expect(diagram.entities[0]?.attributes[0]).toMatchObject({ nullable: true, unique: true });

    diagram = applyCommand(diagram, {
      type: 'DeleteAttribute',
      entityId: 'e1',
      attributeId: 'e1-pk',
    });
    expect(diagram.entities[0]?.attributes).toEqual([]);
  });

  it('reorders attributes', () => {
    let diagram = fixture();
    diagram = applyCommand(diagram, {
      type: 'AddAttribute',
      entityId: 'e1',
      attribute: createAttribute({ id: 'e1-name', name: 'name' }),
    });
    diagram = applyCommand(diagram, {
      type: 'ReorderAttribute',
      entityId: 'e1',
      attributeId: 'e1-name',
      toIndex: 0,
    });

    expect(diagram.entities[0]?.attributes.map((attribute) => attribute.id)).toEqual([
      'e1-name',
      'e1-pk',
    ]);
  });

  it('creates, updates and deletes relationships', () => {
    let diagram = applyCommand(fixture(), relationshipCommand());
    expect(diagram.relationships).toHaveLength(1);

    diagram = applyCommand(diagram, {
      type: 'UpdateRelationship',
      relationshipId: 'r1',
      patch: { identifying: true },
    });
    expect(diagram.relationships[0]?.identifying).toBe(true);

    diagram = applyCommand(diagram, { type: 'DeleteRelationship', relationshipId: 'r1' });
    expect(diagram.relationships).toEqual([]);
  });

  it('updates diagram name, viewport and grid', () => {
    let diagram = applyCommand(fixture(), { type: 'RenameDiagram', name: 'Renamed' });
    diagram = applyCommand(diagram, {
      type: 'SetViewport',
      viewport: { x: -10, y: 20, zoom: 1.5 },
    });
    diagram = applyCommand(diagram, { type: 'SetGrid', patch: { snap: true } });

    expect(diagram.name).toBe('Renamed');
    expect(diagram.layout.viewport).toEqual({ x: -10, y: 20, zoom: 1.5 });
    expect(diagram.layout.grid).toMatchObject({ snap: true, size: 20 });
  });

  it('returns the same reference for commands that affect nothing', () => {
    const diagram = fixture();

    expect(applyCommand(diagram, { type: 'MoveEntity', entityId: 'missing', x: 1, y: 1 })).toBe(
      diagram,
    );
    expect(applyCommand(diagram, { type: 'DeleteEntity', entityId: 'missing' })).toBe(diagram);
    expect(applyCommand(diagram, { type: 'DeleteRelationship', relationshipId: 'missing' })).toBe(
      diagram,
    );
  });
});
