import { html, render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { applyCommand } from '../../src/domain/commands.js';
import {
  createAttribute,
  createDiagram,
  createEntity,
  createEntityLayout,
  createRelationship,
  createRelationshipEnd,
} from '../../src/domain/model.js';
import { renderScene } from '../../src/render/scene.js';
import type { Diagram } from '../../src/domain/types.js';

function entity(
  id: string,
  name: string,
  x: number,
  attributes: string[] = ['id'],
): Parameters<typeof applyCommand>[1] {
  return {
    type: 'AddEntity',
    entity: createEntity({
      id,
      name,
      attributes: attributes.map((attributeName, index) =>
        createAttribute({ id: `${id}-${index}`, name: attributeName, nullable: index !== 0 }),
      ),
    }),
    layout: createEntityLayout({ x, y: 0 }),
  };
}

function fixture(): Diagram {
  let diagram = createDiagram();
  diagram = applyCommand(diagram, entity('e1', 'Customer', 0));
  diagram = applyCommand(diagram, entity('e2', 'Order', 400, ['id', 'total']));
  diagram = applyCommand(diagram, {
    type: 'CreateRelationship',
    relationship: createRelationship(
      createRelationshipEnd('e1', { cardinality: 'one', optionality: 'mandatory' }),
      createRelationshipEnd('e2', { cardinality: 'many', optionality: 'optional' }),
      { id: 'r1', identifying: true, sourceLabel: 'places', targetLabel: 'placed by' },
    ),
  });
  return diagram;
}

describe('renderScene', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  function draw(diagram: Diagram) {
    container = document.createElement('div');
    document.body.append(container);
    render(html`<svg>${renderScene(diagram, null)}</svg>`, container);
    return container;
  }

  it('renders every entity with its name and attribute markers', () => {
    const view = draw(fixture());

    expect(view.querySelectorAll('[data-entity-id]')).toHaveLength(2);
    expect(view.textContent).toContain('Customer');
    expect(view.textContent).toContain('Order');
    expect(view.querySelectorAll('[data-attribute-id]')).toHaveLength(3);
    expect(view.querySelectorAll('.attribute__marker')).toHaveLength(3);
  });

  it('draws a crow foot only on the many end', () => {
    const view = draw(fixture());

    expect(view.querySelectorAll('.relationship__crowfoot')).toHaveLength(1);
  });

  it('draws the identifying bar and both perspective labels', () => {
    const view = draw(fixture());

    expect(view.querySelectorAll('.relationship__bar')).toHaveLength(1);
    expect(view.textContent).toContain('places');
    expect(view.textContent).toContain('placed by');
  });

  it('marks the selected entity', () => {
    const view = draw(fixture());
    render(html`<svg>${renderScene(fixture(), { kind: 'entity', id: 'e1' })}</svg>`, view);

    expect(view.querySelector('[data-entity-id="e1"]')?.classList.contains('is-selected')).toBe(
      true,
    );
    expect(view.querySelector('[data-entity-id="e2"]')?.classList.contains('is-selected')).toBe(
      false,
    );
  });
});
