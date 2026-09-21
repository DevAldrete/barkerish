import { describe, expect, it } from 'vitest';
import {
  ATTRIBUTE_ROW_HEIGHT,
  ENTITY_HEADER_HEIGHT,
  ENTITY_VERTICAL_PADDING,
  borderPoint,
  boxCenter,
  entityBox,
  entityHeight,
  relationshipGeometry,
  snapToGrid,
} from '../../src/notation/geometry.js';

describe('entityHeight', () => {
  it('grows with the attribute count', () => {
    expect(entityHeight(2) - entityHeight(1)).toBe(ATTRIBUTE_ROW_HEIGHT);
    expect(entityHeight(0)).toBe(entityHeight(1));
    expect(entityHeight(1)).toBe(
      ENTITY_HEADER_HEIGHT + ENTITY_VERTICAL_PADDING * 2 + ATTRIBUTE_ROW_HEIGHT,
    );
  });
});

describe('entityBox', () => {
  it('derives height from the attribute count', () => {
    expect(entityBox({ x: 10, y: 20, width: 220 }, 2)).toEqual({
      x: 10,
      y: 20,
      width: 220,
      height: entityHeight(2),
    });
  });
});

describe('borderPoint', () => {
  const box = { x: 0, y: 0, width: 100, height: 100 };

  it('anchors to the right and left sides', () => {
    expect(borderPoint(box, { x: 500, y: 50 })).toEqual({ x: 100, y: 50 });
    expect(borderPoint(box, { x: -500, y: 50 })).toEqual({ x: 0, y: 50 });
  });

  it('anchors to the top and bottom sides', () => {
    expect(borderPoint(box, { x: 50, y: -500 })).toEqual({ x: 50, y: 0 });
    expect(borderPoint(box, { x: 50, y: 500 })).toEqual({ x: 50, y: 100 });
  });

  it('returns the centre when the target coincides with it', () => {
    expect(borderPoint(box, boxCenter(box))).toEqual({ x: 50, y: 50 });
  });
});

describe('relationshipGeometry', () => {
  it('connects facing sides with a horizontal edge', () => {
    const source = { x: 0, y: 0, width: 100, height: 60 };
    const target = { x: 300, y: 0, width: 100, height: 60 };
    const edge = relationshipGeometry(source, target);

    expect(edge.start).toEqual({ x: 100, y: 30 });
    expect(edge.end).toEqual({ x: 300, y: 30 });
    expect(edge.angle).toBe(0);
    expect(edge.mid).toEqual({ x: 200, y: 30 });
    expect(edge.length).toBe(200);
  });
});

describe('snapToGrid', () => {
  it('rounds to the nearest multiple and passes through invalid sizes', () => {
    expect(snapToGrid(23, 20)).toBe(20);
    expect(snapToGrid(31, 20)).toBe(40);
    expect(snapToGrid(31, 0)).toBe(31);
  });
});
