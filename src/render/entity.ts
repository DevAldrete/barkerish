import { nothing, svg } from 'lit';
import type { TemplateResult } from 'lit';
import type { Entity } from '../domain/types.js';
import { MARKER_GLYPH, attributeMarker } from '../notation/barker.js';
import {
  ATTRIBUTE_ROW_HEIGHT,
  ENTITY_HEADER_HEIGHT,
  ENTITY_VERTICAL_PADDING,
} from '../notation/geometry.js';
import type { Box } from '../notation/geometry.js';

const CORNER_RADIUS = 6;
const MARKER_X = 12;
const NAME_X = 30;
const EDGE_PADDING = 10;
const UNIQUE_OFFSET = 22;

export function renderEntity(entity: Entity, box: Box, selected: boolean): TemplateResult {
  const nameY = box.y + ENTITY_HEADER_HEIGHT / 2;
  const rowsY = box.y + ENTITY_HEADER_HEIGHT + ENTITY_VERTICAL_PADDING;

  return svg`
    <g class="entity ${selected ? 'is-selected' : ''}" data-entity-id=${entity.id}>
      <rect
        class="entity__body"
        x=${box.x}
        y=${box.y}
        width=${box.width}
        height=${box.height}
        rx=${CORNER_RADIUS}
      />
      <path class="entity__header" d=${headerPath(box)} />
      <text
        class="entity__name"
        x=${box.x + box.width / 2}
        y=${nameY}
        text-anchor="middle"
        dominant-baseline="central"
      >
        ${entity.name}
      </text>
      ${entity.attributes.map((attribute, index) =>
        renderAttributeRow(
          attribute,
          box,
          rowsY + index * ATTRIBUTE_ROW_HEIGHT + ATTRIBUTE_ROW_HEIGHT / 2,
        ),
      )}
    </g>
  `;
}

function renderAttributeRow(
  attribute: Entity['attributes'][number],
  box: Box,
  centerY: number,
): TemplateResult {
  const unique = attribute.unique;

  return svg`
    <g class="attribute" data-attribute-id=${attribute.id}>
      <text
        class="attribute__marker"
        x=${box.x + MARKER_X}
        y=${centerY}
        dominant-baseline="central"
      >
        ${MARKER_GLYPH[attributeMarker(attribute)]}
      </text>
      <text class="attribute__name" x=${box.x + NAME_X} y=${centerY} dominant-baseline="central">
        ${attribute.name}
      </text>
      ${
        unique
          ? svg`<text
              class="attribute__unique"
              x=${box.x + box.width - EDGE_PADDING}
              y=${centerY}
              text-anchor="end"
              dominant-baseline="central"
            >U</text>`
          : nothing
      }
      <text
        class="attribute__type"
        x=${box.x + box.width - EDGE_PADDING - (unique ? UNIQUE_OFFSET : 0)}
        y=${centerY}
        text-anchor="end"
        dominant-baseline="central"
      >
        ${attribute.dataType}
      </text>
    </g>
  `;
}

function headerPath(box: Box): string {
  const r = CORNER_RADIUS;
  const x = box.x;
  const y = box.y;
  const width = box.width;
  const height = ENTITY_HEADER_HEIGHT;

  return [
    `M ${x + r} ${y}`,
    `H ${x + width - r}`,
    `A ${r} ${r} 0 0 1 ${x + width} ${y + r}`,
    `V ${y + height}`,
    `H ${x}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join(' ');
}
