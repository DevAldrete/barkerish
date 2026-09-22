import { describe, expect, it } from 'vitest';
import { createDiagram, createEntity, createEntityLayout } from '../../src/domain/model.js';
import type { Diagram } from '../../src/domain/types.js';
import { parseDocument, reconcileDocument } from '../../src/dsl/index.js';

function parse(source: string) {
  const { document, errors } = parseDocument(source);
  expect(errors).toEqual([]);
  return document;
}

describe('reconcileDocument', () => {
  it('compiles a parsed document into a domain diagram', () => {
    const parsed = parse(`
      diagram "Sales" {
        entity Customer {
          id: integer pk
          name: text not null
        }
        entity Order {
          id: integer pk
        }
        relationship Customer (0..*) -> Order (1..1) : "places" / "placed by"
      }
    `);

    const { diagrams, removed, errors } = reconcileDocument(parsed, []);

    expect(errors).toEqual([]);
    expect(removed).toEqual([]);
    expect(diagrams).toHaveLength(1);

    const diagram = diagrams[0]!;
    expect(diagram.name).toBe('Sales');
    expect(diagram.entities.map((entity) => entity.name)).toEqual(['Customer', 'Order']);

    const relationship = diagram.relationships[0]!;
    expect(relationship.sourceLabel).toBe('places');
    expect(relationship.targetLabel).toBe('placed by');
    expect(relationship.source.entityId).toBe(diagram.entities[0]!.id);
    expect(relationship.target.entityId).toBe(diagram.entities[1]!.id);
    expect(relationship.source).toMatchObject({ optionality: 'optional', cardinality: 'many' });
    expect(relationship.target).toMatchObject({ optionality: 'mandatory', cardinality: 'one' });
  });

  it('reuses entity, attribute and relationship ids and layout from the existing diagram', () => {
    const existing = createDiagram('Sales');
    const customer = createEntity({ id: 'e-customer', name: 'Customer' });
    const order = createEntity({ id: 'e-order', name: 'Order' });
    existing.entities = [customer, order];
    existing.layout.entities = {
      'e-customer': { ...createEntityLayout({ x: 300, y: 120 }), width: 240 },
      'e-order': createEntityLayout({ x: 600, y: 120 }),
    };
    existing.relationships = [
      {
        id: 'r-1',
        sourceLabel: 'places',
        targetLabel: 'placed by',
        source: { entityId: 'e-customer', optionality: 'optional', cardinality: 'many' },
        target: { entityId: 'e-order', optionality: 'mandatory', cardinality: 'one' },
        identifying: false,
      },
    ];

    const parsed = parse(`
      diagram "Sales" {
        entity Customer {
          id: integer pk
        }
        entity Order {
          id: integer pk
        }
        relationship Customer (0..*) -> Order (1..1) : "places" / "placed by"
      }
    `);

    const { diagrams } = reconcileDocument(parsed, [existing]);
    const diagram = diagrams[0]!;

    expect(diagram.id).toBe(existing.id);
    expect(diagram.createdAt).toBe(existing.createdAt);
    expect(diagram.entities[0]!.id).toBe('e-customer');
    expect(diagram.entities[0]!.attributes[0]!.id).toBe(customer.attributes[0]!.id);
    expect(diagram.layout.entities['e-customer']).toEqual({ x: 300, y: 120, width: 240 });
    expect(diagram.relationships[0]!.id).toBe('r-1');
  });

  it('matches diagrams by stable key even when the name changes', () => {
    const existing: Diagram = { ...createDiagram('Old'), id: 'd-1' };
    const parsed = parse(`
      diagram "New" [d-1] {
        entity A { id: integer pk }
      }
    `);

    const { diagrams, removed } = reconcileDocument(parsed, [existing]);

    expect(diagrams[0]!.id).toBe('d-1');
    expect(diagrams[0]!.name).toBe('New');
    expect(removed).toEqual([]);
  });

  it('reports existing diagrams the document did not mention as removed', () => {
    const kept = { ...createDiagram('Kept'), id: 'keep' };
    const gone = { ...createDiagram('Gone'), id: 'gone' };

    const { diagrams, removed } = reconcileDocument(
      parse(`diagram "Kept" [keep] { entity A { id: integer pk } }`),
      [kept, gone],
    );

    expect(diagrams.map((diagram) => diagram.id)).toEqual(['keep']);
    expect(removed.map((diagram) => diagram.id)).toEqual(['gone']);
  });

  it('reports unknown entity references', () => {
    const parsed = parse(`
      diagram "D" {
        entity A { id: integer pk }
        relationship A (1..1) -> Ghost (0..*)
      }
    `);

    const { errors, diagrams } = reconcileDocument(parsed, []);

    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain("Unknown entity 'Ghost'");
    expect(diagrams[0]!.relationships).toEqual([]);
  });
});
