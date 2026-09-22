import { beforeEach, describe, expect, it } from 'vitest';
import { DocumentManager } from '../../src/store/document-manager.js';
import { EditorStore } from '../../src/store/editor-store.js';
import { MemoryDiagramRepository } from '../../src/persistence/memory-repository.js';
import { createDiagram } from '../../src/domain/model.js';

function setup() {
  const store = new EditorStore(createDiagram());
  const repository = new MemoryDiagramRepository();
  const manager = new DocumentManager(store, repository);
  return { store, repository, manager };
}

describe('DocumentManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates and persists a first diagram when storage is empty', async () => {
    const { store, repository, manager } = setup();

    await manager.init();

    expect(await repository.list()).toHaveLength(1);
    expect(manager.currentId).toBe(store.diagram.id);
    manager.dispose();
  });

  it('creates additional diagrams and switches to them', async () => {
    const { store, manager } = setup();
    await manager.init();
    const firstId = manager.currentId;

    await manager.create('Second');

    expect(manager.diagrams).toHaveLength(2);
    expect(manager.currentId).not.toBe(firstId);
    expect(store.diagram.name).toBe('Second');
    manager.dispose();
  });

  it('opens an existing diagram', async () => {
    const { store, repository, manager } = setup();
    await manager.init();
    const firstId = manager.currentId!;
    await manager.create('Second');

    await manager.open(firstId);

    expect(manager.currentId).toBe(firstId);
    expect(store.diagram.name).toBe((await repository.load(firstId))?.name);
    manager.dispose();
  });

  it('reopens the last used diagram on init', async () => {
    const repository = new MemoryDiagramRepository();
    const storeA = new EditorStore(createDiagram());
    const managerA = new DocumentManager(storeA, repository);
    await managerA.init();
    await managerA.create('Second');
    const created = managerA.currentId!;
    managerA.dispose();

    const storeB = new EditorStore(createDiagram());
    const managerB = new DocumentManager(storeB, repository);
    await managerB.init();

    expect(managerB.currentId).toBe(created);
    expect(storeB.diagram.name).toBe('Second');
    managerB.dispose();
  });

  it('falls back to another diagram after deleting the current one', async () => {
    const { manager } = setup();
    await manager.init();
    const firstId = manager.currentId!;
    await manager.create('Second');
    const secondId = manager.currentId!;

    await manager.remove(secondId);

    expect(manager.currentId).toBe(firstId);
    expect(manager.diagrams).toHaveLength(1);
    manager.dispose();
  });

  it('reflects live name changes in the list', async () => {
    const { store, manager } = setup();
    await manager.init();

    store.dispatch({ type: 'RenameDiagram', name: 'Renamed' });

    expect(manager.diagrams[0]?.name).toBe('Renamed');
    manager.dispose();
  });

  it('imports a diagram as a new document', async () => {
    const { repository, manager } = setup();
    await manager.init();
    const imported = { ...createDiagram('Imported'), id: 'imported-id' };

    await manager.importDiagram(imported);

    expect(manager.currentId).toBe('imported-id');
    expect(await repository.load('imported-id')).toBeTruthy();
    manager.dispose();
  });

  it('re-identifies an imported diagram whose id already exists', async () => {
    const { repository, manager } = setup();
    await manager.init();
    const existingId = manager.currentId!;

    await manager.importDiagram({ ...createDiagram('Clone'), id: existingId });

    expect(manager.currentId).not.toBe(existingId);
    expect((await repository.list()).length).toBe(2);
    manager.dispose();
  });
});
