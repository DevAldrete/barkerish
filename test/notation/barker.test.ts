import { describe, expect, it } from 'vitest';
import {
  attributeMarker,
  endDecoration,
  relationshipDecoration,
  verbalizeRelationship,
} from '../../src/notation/barker.js';
import {
  createAttribute,
  createRelationship,
  createRelationshipEnd,
} from '../../src/domain/model.js';

describe('endDecoration', () => {
  it('maps mandatory to a solid line and optional to a dotted line', () => {
    expect(endDecoration(createRelationshipEnd('a', { optionality: 'mandatory' })).lineStyle).toBe(
      'solid',
    );
    expect(endDecoration(createRelationshipEnd('a', { optionality: 'optional' })).lineStyle).toBe(
      'dotted',
    );
  });

  it('maps many to a crow foot', () => {
    expect(endDecoration(createRelationshipEnd('a', { cardinality: 'many' })).crowFoot).toBe(true);
    expect(endDecoration(createRelationshipEnd('a', { cardinality: 'one' })).crowFoot).toBe(false);
  });
});

describe('relationshipDecoration', () => {
  it('draws the identifying bar only at the child (target) end', () => {
    const relationship = createRelationship(
      createRelationshipEnd('parent', { cardinality: 'one' }),
      createRelationshipEnd('child', { cardinality: 'many' }),
      { identifying: true },
    );

    const decoration = relationshipDecoration(relationship);
    expect(decoration.source.identifyingBar).toBe(false);
    expect(decoration.target.identifyingBar).toBe(true);
    expect(decoration.target.crowFoot).toBe(true);
  });
});

describe('attributeMarker', () => {
  it('prefers the primary key marker, then optionality', () => {
    expect(attributeMarker(createAttribute({ primaryKey: true, nullable: true }))).toBe('primary');
    expect(attributeMarker(createAttribute({ nullable: false }))).toBe('mandatory');
    expect(attributeMarker(createAttribute({ nullable: true }))).toBe('optional');
  });
});

describe('verbalizeRelationship', () => {
  it('describes each perspective using the opposite end cardinality', () => {
    const relationship = createRelationship(
      createRelationshipEnd('customer', { cardinality: 'one', optionality: 'mandatory' }),
      createRelationshipEnd('order', { cardinality: 'many', optionality: 'optional' }),
      { sourceLabel: 'a placer of', targetLabel: 'placed by' },
    );

    const sentences = verbalizeRelationship(relationship, 'Customer', 'Order');
    expect(sentences.source).toBe('Each Customer must be a placer of one or more Order.');
    expect(sentences.target).toBe('Each Order may be placed by one and only one Customer.');
  });
});
