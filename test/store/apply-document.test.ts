import { beforeEach, describe, expect, it } from 'vitest';
import { createDiagram, createEntity } from '../../src/domain/model.js';
import { MemoryDiagramRepository } from '../../src/persistence/memory-repository.js';
import { DocumentManager } from '../../src/store/document-manager.js';
import { EditorStore } from '../../src/store/editor-store.js';
import { applyDocument, planDocument } from '../../src/store/apply-document.js';

function salesDiagram(id = 'd-sales') {
  const diagram = createDiagram('Sales');
  diagram.id = id;
  diagram.entities = [createEntity({ id: 'e-customer', name: 'Customer', attributes: [] })];
  diagram.layout.entities = { 'e-customer': { x: 100, y: 50, width: 220 } };
  return diagram;
}

async function setup() {
  const store = new EditorStore(createDiagram('Placeholder'));
  const repository = new MemoryDiagramRepository();
  const manager = new DocumentManager(store, repository);
  return { store, repository, manager };
}

describe('applyDocument', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('plans an update to an existing diagram and preserves layout', async () => {
    const { repository, manager } = await setup();
    await repository.save(salesDiagram());
    await manager.open('d-sales');

    const plan = await planDocument(
      `
        diagram "Sales" [d-sales] {
          entity Customer [e-customer] {
            id: integer pk
          }
          entity Order {
            id: integer pk
          }
        }
      `,
      manager,
    );

    expect(plan.errors).toEqual([]);
    expect(plan.removed).toEqual([]);
    expect(plan.diagrams).toHaveLength(1);
    expect(plan.diagrams[0]!.entities.map((entity) => entity.name)).toEqual(['Customer', 'Order']);
    expect(plan.diagrams[0]!.layout.entities['e-customer']).toEqual({
      x: 100,
      y: 50,
      width: 220,
    });
  });

  it('reports parse errors and applies nothing', async () => {
    const { store, manager } = await setup();
    const plan = await planDocument('entity Customer { id: integer pk }', manager);

    expect(plan.errors).toHaveLength(1);
    expect(plan.diagrams).toEqual([]);

    const result = await applyDocument(plan, manager, store);
    expect(result.applied).toEqual([]);
  });

  it('updates the current diagram through the undoable store', async () => {
    const { store, repository, manager } = await setup();
    await repository.save(salesDiagram());
    await manager.open('d-sales');

    const plan = await planDocument(
      `diagram "Sales" [d-sales] { entity Customer [e-customer] { id: integer pk } }`,
      manager,
    );
    await applyDocument(plan, manager, store);

    expect(store.diagram.name).toBe('Sales');
    expect(store.diagram.entities[0]!.name).toBe('Customer');
    expect(store.canUndo).toBe(true);

    store.undo();
    expect(store.diagram.entities).toHaveLength(1);
  });

  it('saves other diagrams directly and deletes unmentioned ones', async () => {
    const { store, repository, manager } = await setup();
    await repository.save(salesDiagram('d-sales'));
    const inventory = createDiagram('Inventory');
    inventory.id = 'd-inventory';
    await repository.save(inventory);
    await manager.open('d-sales');

    const plan = await planDocument(
      `
        diagram "Sales" [d-sales] {
          entity Customer [e-customer] { id: integer pk }
        }
        diagram "Stock" [d-inventory] {
          entity Product { id: integer pk }
        }
      `,
      manager,
    );

    expect(plan.removed).toEqual([]);

    const result = await applyDocument(plan, manager, store);

    expect(result.removed).toEqual([]);
    expect(manager.diagrams.map((diagram) => diagram.name).sort()).toEqual(['Sales', 'Stock']);
    const saved = await repository.load('d-inventory');
    expect(saved?.name).toBe('Stock');
    expect(saved?.entities[0]!.name).toBe('Product');
  });

  it('deletes diagrams the text does not mention', async () => {
    const { store, repository, manager } = await setup();
    await repository.save(salesDiagram('d-sales'));
    const old = createDiagram('Old');
    old.id = 'd-old';
    await repository.save(old);
    await manager.open('d-sales');

    const plan = await planDocument(
      `diagram "Sales" [d-sales] { entity Customer [e-customer] { id: integer pk } }`,
      manager,
    );

    expect(plan.removed.map((diagram) => diagram.id)).toEqual(['d-old']);

    const result = await applyDocument(plan, manager, store);

    expect(result.removed.map((diagram) => diagram.id)).toEqual(['d-old']);
    expect(await repository.load('d-old')).toBeUndefined();
  });

  it('opens another diagram when the current one is removed', async () => {
    const { store, repository, manager } = await setup();
    await repository.save(salesDiagram('d-sales'));
    const keep = createDiagram('Keep');
    keep.id = 'd-keep';
    await repository.save(keep);
    await manager.open('d-sales');

    const plan = await planDocument(
      `diagram "Keep" [d-keep] { entity A { id: integer pk } }`,
      manager,
    );
    expect(plan.removed.map((diagram) => diagram.id)).toEqual(['d-sales']);

    await applyDocument(plan, manager, store);

    expect(manager.currentId).toBe('d-keep');
    expect(store.diagram.name).toBe('Keep');
    expect(await repository.load('d-sales')).toBeUndefined();
  });
});
