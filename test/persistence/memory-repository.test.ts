import { describe, expect, it } from 'vitest';
import { MemoryDiagramRepository } from '../../src/persistence/memory-repository.js';
import { createDiagram } from '../../src/domain/model.js';

describe('MemoryDiagramRepository', () => {
  it('round-trips a diagram without sharing references', async () => {
    const repository = new MemoryDiagramRepository();
    const diagram = createDiagram('Saved');

    await repository.save(diagram);
    const loaded = await repository.load(diagram.id);

    expect(loaded).toEqual(diagram);
    expect(loaded).not.toBe(diagram);

    loaded!.name = 'Mutated';
    expect((await repository.load(diagram.id))?.name).toBe('Saved');
  });

  it('lists diagrams most recently updated first', async () => {
    const repository = new MemoryDiagramRepository();
    await repository.save({
      ...createDiagram('Older'),
      id: 'a',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });
    await repository.save({
      ...createDiagram('Newer'),
      id: 'b',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });

    const list = await repository.list();

    expect(list.map((meta) => meta.id)).toEqual(['b', 'a']);
  });

  it('deletes diagrams and returns undefined for missing ones', async () => {
    const repository = new MemoryDiagramRepository();
    const diagram = createDiagram();
    await repository.save(diagram);

    await repository.delete(diagram.id);

    expect(await repository.load(diagram.id)).toBeUndefined();
    expect(await repository.list()).toEqual([]);
  });
});
