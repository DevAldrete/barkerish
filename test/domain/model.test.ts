import { describe, expect, it } from 'vitest';
import {
  createAttribute,
  createDiagram,
  createEmptyLayout,
  createEntity,
  createEntityLayout,
  createRelationship,
  createRelationshipEnd,
  nextEntityPosition,
} from '../../src/domain/model.js';

describe('createDiagram', () => {
  it('produces an empty, versioned diagram with defaults', () => {
    const diagram = createDiagram('Sales');

    expect(diagram.name).toBe('Sales');
    expect(diagram.formatVersion).toBe(1);
    expect(diagram.entities).toEqual([]);
    expect(diagram.relationships).toEqual([]);
    expect(diagram.layout.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(diagram.layout.grid).toEqual({ visible: true, size: 20, snap: false });
    expect(diagram.createdAt).toBe(diagram.updatedAt);
  });
});

describe('createEntity', () => {
  it('defaults to a single primary-key id attribute', () => {
    const entity = createEntity({ id: 'e1', name: 'Customer' });

    expect(entity.id).toBe('e1');
    expect(entity.name).toBe('Customer');
    expect(entity.attributes).toHaveLength(1);
    expect(entity.attributes[0]).toMatchObject({
      name: 'id',
      dataType: 'integer',
      primaryKey: true,
      nullable: false,
    });
  });

  it('honours an explicit empty attribute list', () => {
    expect(createEntity({ attributes: [] }).attributes).toEqual([]);
  });
});

describe('createAttribute', () => {
  it('defaults to nullable and not a key', () => {
    expect(createAttribute()).toMatchObject({
      dataType: '',
      primaryKey: false,
      foreignKey: false,
      nullable: true,
      unique: false,
    });
  });
});

describe('createRelationship', () => {
  it('defaults ends to optional many and non-identifying', () => {
    const relationship = createRelationship(createRelationshipEnd('a'), createRelationshipEnd('b'));

    expect(relationship.source).toEqual({
      entityId: 'a',
      optionality: 'optional',
      cardinality: 'many',
    });
    expect(relationship.target).toEqual({
      entityId: 'b',
      optionality: 'optional',
      cardinality: 'many',
    });
    expect(relationship.identifying).toBe(false);
  });
});

describe('nextEntityPosition', () => {
  it('cascades and wraps into rows', () => {
    expect(nextEntityPosition(0)).toEqual({ x: 80, y: 80 });
    expect(nextEntityPosition(1).x).toBeGreaterThan(nextEntityPosition(0).x);
    expect(nextEntityPosition(4).y).toBeGreaterThan(nextEntityPosition(0).y);
    expect(nextEntityPosition(4).x).toBe(nextEntityPosition(0).x);
  });
});

describe('createEmptyLayout', () => {
  it('starts with no entity positions', () => {
    expect(createEmptyLayout().entities).toEqual({});
  });
});

describe('createEntityLayout', () => {
  it('applies the default width at the given position', () => {
    expect(createEntityLayout({ x: 10, y: 20 })).toEqual({ x: 10, y: 20, width: 220 });
  });
});
