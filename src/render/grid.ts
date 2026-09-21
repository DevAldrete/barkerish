import { nothing, svg } from 'lit';
import type { TemplateResult } from 'lit';

const GRID_ID = 'barkerish-grid';
const GRID_EXTENT = 10000;

export function renderGrid(size: number, visible: boolean): TemplateResult | typeof nothing {
  if (!visible) {
    return nothing;
  }

  return svg`
    <defs>
      <pattern id=${GRID_ID} width=${size} height=${size} patternUnits="userSpaceOnUse">
        <path class="grid__line" d="M ${size} 0 L 0 0 0 ${size}" fill="none" />
      </pattern>
    </defs>
    <rect
      class="grid"
      x=${-GRID_EXTENT}
      y=${-GRID_EXTENT}
      width=${GRID_EXTENT * 2}
      height=${GRID_EXTENT * 2}
      fill="url(#${GRID_ID})"
    />
  `;
}
