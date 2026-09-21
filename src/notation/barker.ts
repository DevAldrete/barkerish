import type { Attribute, Relationship, RelationshipEnd } from '../domain/types.js';

export type LineStyle = 'solid' | 'dotted';
export type AttributeMarker = 'primary' | 'mandatory' | 'optional';

export interface EndDecoration {
  lineStyle: LineStyle;
  crowFoot: boolean;
  identifyingBar: boolean;
}

export interface RelationshipDecoration {
  source: EndDecoration;
  target: EndDecoration;
}

export function endDecoration(end: RelationshipEnd): EndDecoration {
  return {
    lineStyle: end.optionality === 'mandatory' ? 'solid' : 'dotted',
    crowFoot: end.cardinality === 'many',
    identifyingBar: false,
  };
}

/**
 * Translate relationship semantics into Barker decorations. The identifying bar is
 * drawn at the child end; the target is treated as the child by convention.
 */
export function relationshipDecoration(relationship: Relationship): RelationshipDecoration {
  return {
    source: endDecoration(relationship.source),
    target: { ...endDecoration(relationship.target), identifyingBar: relationship.identifying },
  };
}

export function attributeMarker(attribute: Attribute): AttributeMarker {
  if (attribute.primaryKey) {
    return 'primary';
  }
  return attribute.nullable ? 'optional' : 'mandatory';
}

export const MARKER_GLYPH: Record<AttributeMarker, string> = {
  primary: '#',
  mandatory: '*',
  optional: 'o',
};

const CARDINALITY_PHRASE = {
  one: 'one and only one',
  many: 'one or more',
} as const;

const OPTIONALITY_PHRASE = {
  mandatory: 'must',
  optional: 'may',
} as const;

/**
 * Barker's verbalization discipline: "Each A (must|may) be R (one and only one B |
 * one or more B)". The cardinality of one perspective is described by the far end,
 * because an end's cardinality counts instances of that end.
 */
export function verbalizeRelationship(
  relationship: Relationship,
  sourceName: string,
  targetName: string,
): { source: string; target: string } {
  return {
    source: `Each ${sourceName} ${OPTIONALITY_PHRASE[relationship.source.optionality]} be ${relationship.sourceLabel} ${CARDINALITY_PHRASE[relationship.target.cardinality]} ${targetName}.`,
    target: `Each ${targetName} ${OPTIONALITY_PHRASE[relationship.target.optionality]} be ${relationship.targetLabel} ${CARDINALITY_PHRASE[relationship.source.cardinality]} ${sourceName}.`,
  };
}
