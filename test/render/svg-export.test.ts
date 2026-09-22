import { describe, expect, it } from 'vitest';
import { diagramBounds, serializeDiagramSvg } from '../../src/render/svg-export.js';
import { applyCommand } from '../../src/domain/commands.js';
import {
  createAttribute,
  createDiagram,
  createEntity,
  createEntityLayout,
} from '../../src/domain/model.js';
import type { Diagram } from '../../src/domain/types.js';

function fixture(): Diagram {
  let diagram = createDiagram('Export');
  diagram = applyCommand(diagram, {
    type: 'AddEntity',
    entity: createEntity({
      id: 'e1',
      name: 'Customer',
      attributes: [createAttribute({ id: 'a1', name: 'id', primaryKey: true })],
    }),
    layout: createEntityLayout({ x: 100, y: 50 }),
  });
  return diagram;
}

describe('diagramBounds', () => {
  it('wraps the entities with padding', () => {
    const bounds = diagramBounds(fixture());

    expect(bounds.x).toBeLessThan(100);
    expect(bounds.y).toBeLessThan(50);
    expect(bounds.width).toBeGreaterThan(220);
  });

  it('falls back to a default size for an empty diagram', () => {
    expect(diagramBounds(createDiagram())).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });
});

describe('serializeDiagramSvg', () => {
  it('produces a standalone SVG with styles and content', () => {
    const markup = serializeDiagramSvg(fixture());

    expect(markup).toContain('<svg');
    expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(markup).toContain('viewBox=');
    expect(markup).toContain('<style');
    expect(markup).toContain('.entity__body');
    expect(markup).toContain('Customer');
  });

  it('embeds the selected theme tokens', () => {
    const markup = serializeDiagramSvg(fixture(), 'nord');

    expect(markup).toContain('--erd-entity-fill:#3b4252');
  });
});
