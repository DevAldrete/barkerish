export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ENTITY_HEADER_HEIGHT = 32;
export const ATTRIBUTE_ROW_HEIGHT = 24;
export const ENTITY_VERTICAL_PADDING = 8;

export function entityHeight(attributeCount: number): number {
  return (
    ENTITY_HEADER_HEIGHT +
    ENTITY_VERTICAL_PADDING * 2 +
    Math.max(attributeCount, 1) * ATTRIBUTE_ROW_HEIGHT
  );
}

export function entityBox(
  layout: { x: number; y: number; width: number },
  attributeCount: number,
): Box {
  return { x: layout.x, y: layout.y, width: layout.width, height: entityHeight(attributeCount) };
}

export function boxCenter(box: Box): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Point where the segment from the box centre to `toward` crosses the box border.
 * Used to anchor straight relationship lines to the nearest side.
 */
export function borderPoint(box: Box, toward: Point): Point {
  const center = boxCenter(box);
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) {
    return center;
  }

  const halfWidth = box.width / 2;
  const halfHeight = box.height / 2;
  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx);
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);

  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

export interface EdgeGeometry {
  start: Point;
  end: Point;
  mid: Point;
  /** Radians, direction from start to end. */
  angle: number;
  length: number;
}

export function relationshipGeometry(source: Box, target: Box): EdgeGeometry {
  const start = borderPoint(source, boxCenter(target));
  const end = borderPoint(target, boxCenter(source));
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  return {
    start,
    end,
    mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    angle: Math.atan2(dy, dx),
    length: Math.hypot(dx, dy),
  };
}

export function snapToGrid(value: number, size: number): number {
  if (size <= 0) {
    return value;
  }
  return Math.round(value / size) * size;
}
