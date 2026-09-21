import { MAX_ZOOM, MIN_ZOOM } from '../domain/model.js';
import type { Viewport } from '../domain/types.js';
import type { Point } from '../notation/geometry.js';

export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
}

/** Convert a point in SVG/screen pixels to scene coordinates. */
export function screenToWorld(screen: Point, viewport: Viewport): Point {
  return {
    x: (screen.x - viewport.x) / viewport.zoom,
    y: (screen.y - viewport.y) / viewport.zoom,
  };
}

export function panBy(viewport: Viewport, dx: number, dy: number): Viewport {
  return { ...viewport, x: viewport.x + dx, y: viewport.y + dy };
}

/** Zoom by a factor while keeping the scene point under the cursor fixed. */
export function zoomAt(viewport: Viewport, screen: Point, factor: number): Viewport {
  const zoom = clampZoom(viewport.zoom * factor);
  if (zoom === viewport.zoom) {
    return viewport;
  }

  const world = screenToWorld(screen, viewport);
  return {
    zoom,
    x: screen.x - world.x * zoom,
    y: screen.y - world.y * zoom,
  };
}
