import { nothing, svg } from 'lit';
import type { TemplateResult } from 'lit';
import type { Relationship } from '../domain/types.js';
import { relationshipDecoration } from '../notation/barker.js';
import type { EndDecoration } from '../notation/barker.js';
import { relationshipGeometry } from '../notation/geometry.js';
import type { Box, Point } from '../notation/geometry.js';

const CROW_FOOT_DEPTH = 12;
const CROW_FOOT_SPREAD = 8;
const BAR_OFFSET = 10;
const BAR_OFFSET_WITH_FOOT = 20;
const BAR_HALF = 8;
const LABEL_OFFSET = 14;

const DASH: Record<EndDecoration['lineStyle'], string> = {
  solid: 'none',
  dotted: '2 5',
};

export function renderRelationship(
  relationship: Relationship,
  sourceBox: Box,
  targetBox: Box,
  selected: boolean,
): TemplateResult {
  const edge = relationshipGeometry(sourceBox, targetBox);
  const decoration = relationshipDecoration(relationship);
  const startDirection = unit(edge.mid, edge.start);
  const endDirection = unit(edge.mid, edge.end);
  const sourceLabel = pointAlong(edge.start, edge.end, 0.35, LABEL_OFFSET);
  const targetLabel = pointAlong(edge.start, edge.end, 0.65, -LABEL_OFFSET);

  return svg`
    <g
      class="relationship ${selected ? 'is-selected' : ''}"
      data-relationship-id=${relationship.id}
    >
      <line
        class="relationship__hit"
        x1=${edge.start.x}
        y1=${edge.start.y}
        x2=${edge.end.x}
        y2=${edge.end.y}
      />
      <line
        class="relationship__line"
        x1=${edge.start.x}
        y1=${edge.start.y}
        x2=${edge.mid.x}
        y2=${edge.mid.y}
        stroke-dasharray=${DASH[decoration.source.lineStyle]}
      />
      <line
        class="relationship__line"
        x1=${edge.mid.x}
        y1=${edge.mid.y}
        x2=${edge.end.x}
        y2=${edge.end.y}
        stroke-dasharray=${DASH[decoration.target.lineStyle]}
      />
      ${renderEndDecoration(decoration.source, edge.start, startDirection)}
      ${renderEndDecoration(decoration.target, edge.end, endDirection)}
      <text class="relationship__label" x=${sourceLabel.x} y=${sourceLabel.y} text-anchor="middle">
        ${relationship.sourceLabel}
      </text>
      <text class="relationship__label" x=${targetLabel.x} y=${targetLabel.y} text-anchor="middle">
        ${relationship.targetLabel}
      </text>
    </g>
  `;
}

function renderEndDecoration(
  decoration: EndDecoration,
  point: Point,
  direction: Point,
): TemplateResult | typeof nothing {
  if (!decoration.crowFoot && !decoration.identifyingBar) {
    return nothing;
  }

  const perp = perpendicular(direction);

  return svg`
    ${decoration.identifyingBar ? renderBar(point, direction, perp, decoration.crowFoot) : nothing}
    ${decoration.crowFoot ? renderCrowFoot(point, direction, perp) : nothing}
  `;
}

function renderCrowFoot(point: Point, direction: Point, perp: Point): TemplateResult {
  const apex = offset(point, direction, -CROW_FOOT_DEPTH);
  const toeA = offset(point, perp, CROW_FOOT_SPREAD);
  const toeB = offset(point, perp, -CROW_FOOT_SPREAD);
  const d = [
    `M ${apex.x} ${apex.y} L ${point.x} ${point.y}`,
    `M ${apex.x} ${apex.y} L ${toeA.x} ${toeA.y}`,
    `M ${apex.x} ${apex.y} L ${toeB.x} ${toeB.y}`,
  ].join(' ');

  return svg`<path class="relationship__crowfoot" d=${d} />`;
}

function renderBar(point: Point, direction: Point, perp: Point, crowFoot: boolean): TemplateResult {
  const center = offset(point, direction, -(crowFoot ? BAR_OFFSET_WITH_FOOT : BAR_OFFSET));
  const a = offset(center, perp, BAR_HALF);
  const b = offset(center, perp, -BAR_HALF);

  return svg`<line class="relationship__bar" x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y} />`;
}

function unit(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function perpendicular(direction: Point): Point {
  return { x: -direction.y, y: direction.x };
}

function offset(point: Point, direction: Point, distance: number): Point {
  return { x: point.x + direction.x * distance, y: point.y + direction.y * distance };
}

function pointAlong(start: Point, end: Point, t: number, normalOffset: number): Point {
  const x = start.x + (end.x - start.x) * t;
  const y = start.y + (end.y - start.y) * t;
  const normal = perpendicular(unit(start, end));
  return { x: x + normal.x * normalOffset, y: y + normal.y * normalOffset };
}
