import { describe, expect, it } from 'vitest';
import { clampZoom, panBy, screenToWorld, zoomAt } from '../../src/ui/viewport.js';
import { MAX_ZOOM, MIN_ZOOM } from '../../src/domain/model.js';

describe('screenToWorld', () => {
  it('inverts pan and zoom', () => {
    const viewport = { x: 100, y: 50, zoom: 2 };

    expect(screenToWorld({ x: 300, y: 250 }, viewport)).toEqual({ x: 100, y: 100 });
  });
});

describe('panBy', () => {
  it('shifts the viewport origin', () => {
    expect(panBy({ x: 10, y: 10, zoom: 1 }, 5, -3)).toEqual({ x: 15, y: 7, zoom: 1 });
  });
});

describe('zoomAt', () => {
  it('keeps the scene point under the cursor fixed', () => {
    const viewport = { x: 0, y: 0, zoom: 1 };
    const screen = { x: 200, y: 100 };
    const worldBefore = screenToWorld(screen, viewport);

    const zoomed = zoomAt(viewport, screen, 2);

    expect(zoomed.zoom).toBe(2);
    expect(screenToWorld(screen, zoomed)).toEqual(worldBefore);
  });

  it('clamps to the allowed zoom range', () => {
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, { x: 0, y: 0 }, 100).zoom).toBe(MAX_ZOOM);
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, { x: 0, y: 0 }, 0.001).zoom).toBe(MIN_ZOOM);
  });

  it('returns the same viewport when clamped at the limit', () => {
    const viewport = { x: 0, y: 0, zoom: MAX_ZOOM };
    expect(zoomAt(viewport, { x: 0, y: 0 }, 2)).toBe(viewport);
  });
});

describe('clampZoom', () => {
  it('bounds the zoom level', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM);
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(1.5)).toBe(1.5);
  });
});
