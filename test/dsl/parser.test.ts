import { describe, expect, it } from 'vitest';
import { parseDocument } from '../../src/dsl/index.js';

const SOURCE = `
# Barkerish DSL
diagram "Sales" [d1] {
  entity Customer [c1] {
    id: integer pk
    name: text not null
    email: text unique
    countryId: integer fk
  }

  entity Order [o1] {
    id: integer pk
    total: numeric(10, 2) not null
  }

  relationship [r1] Customer (0..*) -> Order (1..1) : "places" / "placed by"
  relationship Order (1..1) -> Customer (0..*) identifying
}
`;

describe('parseDocument', () => {
  it('parses diagrams, entities, attributes and relationships', () => {
    const { document, errors } = parseDocument(SOURCE);

    expect(errors).toEqual([]);
    expect(document.diagrams).toHaveLength(1);

    const diagram = document.diagrams[0]!;
    expect(diagram).toMatchObject({ name: 'Sales', key: 'd1' });
    expect(diagram.entities.map((entity) => entity.name)).toEqual(['Customer', 'Order']);
    expect(diagram.entities[0]!.key).toBe('c1');

    expect(diagram.entities[0]!.attributes).toEqual([
      {
        name: 'id',
        dataType: 'integer',
        primaryKey: true,
        foreignKey: false,
        nullable: true,
        unique: false,
      },
      {
        name: 'name',
        dataType: 'text',
        primaryKey: false,
        foreignKey: false,
        nullable: false,
        unique: false,
      },
      {
        name: 'email',
        dataType: 'text',
        primaryKey: false,
        foreignKey: false,
        nullable: true,
        unique: true,
      },
      {
        name: 'countryId',
        dataType: 'integer',
        primaryKey: false,
        foreignKey: true,
        nullable: true,
        unique: false,
      },
    ]);

    expect(diagram.entities[1]!.attributes[1]!.dataType).toBe('numeric(10,2)');

    expect(diagram.relationships).toHaveLength(2);
    expect(diagram.relationships[0]).toEqual({
      key: 'r1',
      source: { entity: 'Customer', optionality: 'optional', cardinality: 'many' },
      target: { entity: 'Order', optionality: 'mandatory', cardinality: 'one' },
      sourceLabel: 'places',
      targetLabel: 'placed by',
      identifying: false,
    });
    expect(diagram.relationships[1]!.identifying).toBe(true);
    expect(diagram.relationships[1]!.sourceLabel).toBe('relates to');
  });

  it('parses multiple diagrams in one document', () => {
    const { document, errors } = parseDocument(`
      diagram "One" { entity A { id: integer pk } }
      diagram "Two" { entity B { id: integer pk } }
    `);

    expect(errors).toEqual([]);
    expect(document.diagrams.map((diagram) => diagram.name)).toEqual(['One', 'Two']);
  });

  it('accepts quoted names and word labels', () => {
    const { document, errors } = parseDocument(`
      diagram "Customer Accounts" {
        entity "Customer Account" { id: integer pk }
        relationship "Customer Account" (1..1) -> Customer (0..*) : has / belongs_to
      }
    `);

    expect(errors).toEqual([]);
    const diagram = document.diagrams[0]!;
    expect(diagram.entities[0]!.name).toBe('Customer Account');
    expect(diagram.relationships[0]!.sourceLabel).toBe('has');
    expect(diagram.relationships[0]!.targetLabel).toBe('belongs_to');
  });

  it('reports a helpful error for an unexpected top-level token', () => {
    const { errors } = parseDocument('entity Customer { id: integer pk }');

    expect(errors).toHaveLength(1);
    expect(errors[0]!.line).toBe(1);
    expect(errors[0]!.message).toContain("Expected 'diagram'");
  });

  it('reports missing colons', () => {
    const { errors } = parseDocument(`
      diagram "D" {
        entity A {
          id integer pk
        }
      }
    `);

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]!.message).toContain("Expected ':'");
  });

  it('accepts attributes with no data type', () => {
    const { document, errors } = parseDocument(`
      diagram "D" {
        entity A {
          id:
          name: pk
        }
      }
    `);

    expect(errors).toEqual([]);
    expect(document.diagrams[0]!.entities[0]!.attributes).toEqual([
      {
        name: 'id',
        dataType: '',
        primaryKey: false,
        foreignKey: false,
        nullable: true,
        unique: false,
      },
      {
        name: 'name',
        dataType: '',
        primaryKey: true,
        foreignKey: false,
        nullable: true,
        unique: false,
      },
    ]);
  });

  it('reports unterminated strings and keys', () => {
    const { errors } = parseDocument('diagram "Oops');

    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('Unterminated string');
  });
});
