import { html, render } from 'lit';
import type { Diagram } from '../domain/types.js';
import { entityBox } from '../notation/geometry.js';
import { renderScene } from './scene.js';
import { SVG_STYLES } from './svg-styles.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PADDING = 48;
const FALLBACK_BOUNDS = { x: 0, y: 0, width: 800, height: 600 };

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function diagramBounds(diagram: Diagram): Bounds {
  const boxes = diagram.entities
    .map((entity) => {
      const layout = diagram.layout.entities[entity.id];
      return layout ? entityBox(layout, entity.attributes.length) : undefined;
    })
    .filter((box): box is NonNullable<typeof box> => box !== undefined);

  if (boxes.length === 0) {
    return FALLBACK_BOUNDS;
  }

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return {
    x: minX - PADDING,
    y: minY - PADDING,
    width: maxX - minX + PADDING * 2,
    height: maxY - minY + PADDING * 2,
  };
}

/** Build a standalone SVG element for the diagram, independent of pan and zoom. */
export function renderDiagramSvg(diagram: Diagram): SVGSVGElement {
  const bounds = diagramBounds(diagram);
  const container = document.createElement('div');

  render(
    html`<svg
      xmlns=${SVG_NS}
      viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"
      width="${bounds.width}"
      height="${bounds.height}"
    >
      ${renderScene(diagram, null)}
    </svg>`,
    container,
  );

  const svg = container.querySelector('svg');
  if (!svg) {
    throw new Error('Failed to render diagram SVG.');
  }

  const style = document.createElementNS(SVG_NS, 'style');
  style.textContent = SVG_STYLES.cssText;
  svg.prepend(style);

  return svg;
}

export function serializeDiagramSvg(diagram: Diagram): string {
  return new XMLSerializer().serializeToString(renderDiagramSvg(diagram));
}
