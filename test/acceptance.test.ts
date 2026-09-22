import { describe, expect, it } from 'vitest';
import { applyCommand } from '../src/domain/commands.js';
import {
  createAttribute,
  createDiagram,
  createEntity,
  createEntityLayout,
  createRelationship,
  createRelationshipEnd,
} from '../src/domain/model.js';
import { parseDiagramFile, serializeDiagram } from '../src/persistence/native-format.js';
import { renderDiagramSvg, serializeDiagramSvg } from '../src/render/svg-export.js';
import { EditorStore } from '../src/store/editor-store.js';

/**
 * Walks the MVP acceptance criteria end to end at the model/service level. The
 * interactive steps (pan, zoom, drag) are covered by unit tests of the viewport
 * and geometry modules.
 */
describe('MVP acceptance', () => {
  it('models, edits, undoes, persists and exports a diagram', () => {
    // 1. Create a diagram.
    const store = new EditorStore(createDiagram('Sales'));

    // 2-3. Add two entities and their attributes.
    const customer = createEntity({
      id: 'customer',
      name: 'Customer',
      attributes: [
        createAttribute({
          id: 'c-id',
          name: 'id',
          dataType: 'int',
          primaryKey: true,
          nullable: false,
        }),
        createAttribute({ id: 'c-name', name: 'name', dataType: 'text', nullable: false }),
      ],
    });
    const order = createEntity({
      id: 'order',
      name: 'Order',
      attributes: [
        createAttribute({
          id: 'o-id',
          name: 'id',
          dataType: 'int',
          primaryKey: true,
          nullable: false,
        }),
        createAttribute({
          id: 'o-customer',
          name: 'customer_id',
          dataType: 'int',
          foreignKey: true,
          nullable: false,
        }),
      ],
    });

    store.dispatch({
      type: 'AddEntity',
      entity: customer,
      layout: createEntityLayout({ x: 0, y: 0 }),
    });
    store.dispatch({
      type: 'AddEntity',
      entity: order,
      layout: createEntityLayout({ x: 400, y: 0 }),
    });

    // 4. Primary and foreign keys are recorded.
    expect(store.diagram.entities[0]?.attributes[0]?.primaryKey).toBe(true);
    expect(store.diagram.entities[1]?.attributes[1]?.foreignKey).toBe(true);

    // 5-6. Create a relationship and configure cardinality/optionality.
    const relationship = createRelationship(
      createRelationshipEnd('customer', { cardinality: 'one', optionality: 'mandatory' }),
      createRelationshipEnd('order', { cardinality: 'many', optionality: 'optional' }),
      { id: 'places', sourceLabel: 'places', targetLabel: 'placed by', identifying: false },
    );
    store.dispatch({ type: 'CreateRelationship', relationship });
    store.dispatch({
      type: 'UpdateRelationship',
      relationshipId: 'places',
      patch: { identifying: true },
    });

    // 7. Barker notation is rendered correctly (crow foot + identifying bar).
    const svg = renderDiagramSvg(store.diagram);
    expect(svg.querySelectorAll('.relationship__crowfoot')).toHaveLength(1);
    expect(svg.querySelectorAll('.relationship__bar')).toHaveLength(1);

    // 8. Move an entity.
    store.dispatch({ type: 'MoveEntity', entityId: 'order', x: 520, y: 40 });
    expect(store.diagram.layout.entities['order']).toMatchObject({ x: 520, y: 40 });

    // 9. Undo and redo.
    store.undo();
    expect(store.diagram.layout.entities['order']).toMatchObject({ x: 400, y: 0 });
    store.redo();
    expect(store.diagram.layout.entities['order']).toMatchObject({ x: 520, y: 40 });

    // 10-12. Persist to the native format and recover model and layout.
    const restored = parseDiagramFile(serializeDiagram(store.diagram));
    expect(restored).toEqual(store.diagram);
    expect(restored.layout.entities['order']).toMatchObject({ x: 520, y: 40 });

    // 13. Export as SVG.
    expect(serializeDiagramSvg(store.diagram)).toContain('Customer');
  });

  it('restores state after a simulated reload through the repository', async () => {
    const { MemoryDiagramRepository } = await import('../src/persistence/memory-repository.js');
    const repository = new MemoryDiagramRepository();

    const original = new EditorStore(createDiagram('Persisted'));
    original.dispatch({
      type: 'AddEntity',
      entity: createEntity({ id: 'e1' }),
      layout: createEntityLayout({ x: 10, y: 10 }),
    });
    await repository.save(original.diagram);

    const reloaded = new EditorStore(createDiagram('placeholder'));
    const list = await repository.list();
    const stored = await repository.load(list[0]!.id);
    reloaded.load(stored!);

    expect(reloaded.diagram.name).toBe('Persisted');
    expect(reloaded.diagram.entities).toHaveLength(1);
    expect(reloaded.diagram.layout.entities['e1']).toMatchObject({ x: 10, y: 10 });
  });

  it('keeps command application pure', () => {
    const diagram = createDiagram();
    const next = applyCommand(diagram, {
      type: 'AddEntity',
      entity: createEntity({ id: 'e1' }),
      layout: createEntityLayout({ x: 0, y: 0 }),
    });

    expect(diagram.entities).toHaveLength(0);
    expect(next.entities).toHaveLength(1);
  });
});
