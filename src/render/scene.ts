import { nothing, svg } from 'lit';
import type { TemplateResult } from 'lit';
import type { Id } from '../domain/ids.js';
import type { Diagram } from '../domain/types.js';
import { entityBox } from '../notation/geometry.js';
import type { Box } from '../notation/geometry.js';
import { renderEntity } from './entity.js';
import { renderGrid } from './grid.js';
import { renderRelationship } from './relationship.js';
import { entitySelected, relationshipSelected } from '../store/selection.js';
import type { Selection } from '../store/selection.js';

/**
 * Render the diagram content as an SVG group, derived purely from the model and
 * layout. The caller (canvas or export) is responsible for the surrounding <svg>
 * element and the viewport transform.
 */
export function renderScene(diagram: Diagram, selection: Selection): TemplateResult {
  const boxes = new Map<Id, Box>();
  for (const entity of diagram.entities) {
    const layout = diagram.layout.entities[entity.id];
    if (layout) {
      boxes.set(entity.id, entityBox(layout, entity.attributes.length));
    }
  }

  return svg`
    <g class="scene">
      ${renderGrid(diagram.layout.grid.size, diagram.layout.grid.visible)}
      <g class="relationships">
        ${diagram.relationships.map((relationship) => {
          if (relationship.source.entityId === relationship.target.entityId) {
            // Self-referencing relationships are deferred beyond v1.
            return nothing;
          }
          const sourceBox = boxes.get(relationship.source.entityId);
          const targetBox = boxes.get(relationship.target.entityId);
          if (!sourceBox || !targetBox) {
            return nothing;
          }
          return renderRelationship(
            relationship,
            sourceBox,
            targetBox,
            relationshipSelected(selection, relationship.id),
          );
        })}
      </g>
      <g class="entities">
        ${diagram.entities.map((entity) => {
          const box = boxes.get(entity.id);
          if (!box) {
            return nothing;
          }
          return renderEntity(entity, box, entitySelected(selection, entity.id));
        })}
      </g>
    </g>
  `;
}
