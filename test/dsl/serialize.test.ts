import { describe, expect, it } from 'vitest';
import { createDiagram, createEntity } from '../../src/domain/model.js';
import type { Diagram } from '../../src/domain/types.js';
import { parseDocument, reconcileDocument, serializeDocument } from '../../src/dsl/index.js';

function salesDiagram(): Diagram {
  const diagram = createDiagram('Sales');
  diagram.entities = [
    createEntity({
      id: 'e-customer',
      name: 'Customer',
      attributes: [
        {
          id: 'a-1',
          name: 'id',
          dataType: 'integer',
          primaryKey: true,
          foreignKey: false,
          nullable: false,
          unique: false,
        },
        {
          id: 'a-2',
          name: 'email',
          dataType: 'text',
          primaryKey: false,
          foreignKey: false,
          nullable: true,
          unique: true,
        },
      ],
    }),
    createEntity({ id: 'e-order', name: 'Order', attributes: [] }),
  ];
  diagram.relationships = [
    {
      id: 'r-1',
      sourceLabel: 'places',
      targetLabel: 'placed by',
      source: { entityId: 'e-customer', optionality: 'optional', cardinality: 'many' },
      target: { entityId: 'e-order', optionality: 'mandatory', cardinality: 'one' },
      identifying: true,
    },
  ];
  diagram.layout.entities = {
    'e-customer': { x: 80, y: 80, width: 220 },
    'e-order': { x: 380, y: 80, width: 220 },
  };
  return diagram;
}

describe('serializeDocument', () => {
  it('emits diagrams, entities, attributes and relationships with keys', () => {
    const text = serializeDocument([salesDiagram()]);

    expect(text).toContain('diagram Sales [');
    expect(text).toContain('entity Customer [e-customer] {');
    expect(text).toContain('id: integer pk not null');
    expect(text).toContain('email: text unique');
    expect(text).toContain('relationship [r-1] Customer (0..*) -> Order (1..1)');
    expect(text).toContain('"places" / "placed by" identifying');
  });

  it('quotes names that are not identifiers or are reserved words', () => {
    const diagram = createDiagram('My Diagram');
    diagram.entities = [
      createEntity({ id: 'e-1', name: 'Customer Account', attributes: [] }),
      createEntity({ id: 'e-2', name: 'entity', attributes: [] }),
    ];

    const text = serializeDocument([diagram]);

    expect(text).toContain('diagram "My Diagram" [');
    expect(text).toContain('entity "Customer Account" [e-1] {');
    expect(text).toContain('entity "entity" [e-2] {');
  });

  it('omits default labels', () => {
    const diagram = createDiagram('D');
    diagram.entities = [createEntity({ id: 'a', name: 'A' }), createEntity({ id: 'b', name: 'B' })];
    diagram.relationships = [
      {
        id: 'r',
        sourceLabel: 'relates to',
        targetLabel: 'relates to',
        source: { entityId: 'a', optionality: 'mandatory', cardinality: 'one' },
        target: { entityId: 'b', optionality: 'optional', cardinality: 'many' },
        identifying: false,
      },
    ];

    const text = serializeDocument([diagram]);

    expect(text).not.toContain('relates to');
    expect(text).toContain('(1..1) -> B (0..*)');
  });

  it('round-trips a document through parse and reconcile', () => {
    const original = salesDiagram();
    const text = serializeDocument([original]);

    const { document, errors } = parseDocument(text);
    expect(errors).toEqual([]);

    const { diagrams, errors: reconcileErrors } = reconcileDocument(document, [original]);
    expect(reconcileErrors).toEqual([]);

    const rebuilt = diagrams[0]!;
    expect(rebuilt.id).toBe(original.id);
    expect(rebuilt.name).toBe(original.name);
    expect(rebuilt.entities).toEqual(original.entities);
    expect(rebuilt.relationships).toEqual(original.relationships);
    expect(rebuilt.layout).toEqual(original.layout);
  });

  it('round-trips multiple diagrams', () => {
    const one = createDiagram('One');
    one.entities = [createEntity({ id: 'x', name: 'X', attributes: [] })];
    const two = createDiagram('Two');
    two.entities = [createEntity({ id: 'y', name: 'Y', attributes: [] })];

    const text = serializeDocument([one, two]);
    const { document } = parseDocument(text);
    const { diagrams } = reconcileDocument(document, [one, two]);

    expect(diagrams.map((diagram) => diagram.id)).toEqual([one.id, two.id]);
  });
});
