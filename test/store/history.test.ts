import { describe, expect, it } from 'vitest';
import { UndoStack } from '../../src/store/history.js';

describe('UndoStack', () => {
  it('starts empty with the initial present', () => {
    const stack = new UndoStack('a');

    expect(stack.present).toBe('a');
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });

  it('walks back and forward through states', () => {
    const stack = new UndoStack('a');
    stack.push('b');
    stack.push('c');

    expect(stack.undo()).toBe('b');
    expect(stack.undo()).toBe('a');
    expect(stack.undo()).toBeUndefined();
    expect(stack.present).toBe('a');

    expect(stack.redo()).toBe('b');
    expect(stack.redo()).toBe('c');
    expect(stack.redo()).toBeUndefined();
  });

  it('clears the redo stack on a new push', () => {
    const stack = new UndoStack('a');
    stack.push('b');
    stack.undo();
    stack.push('c');

    expect(stack.canRedo).toBe(false);
    expect(stack.present).toBe('c');
  });

  it('coalesces consecutive pushes with the same key', () => {
    const stack = new UndoStack('a');
    stack.push('b', { coalesceKey: 'drag' });
    stack.push('c', { coalesceKey: 'drag' });
    stack.push('d', { coalesceKey: 'drag' });

    expect(stack.undoDepth).toBe(1);
    expect(stack.undo()).toBe('a');
  });

  it('starts a new entry after coalescing ends', () => {
    const stack = new UndoStack('a');
    stack.push('b', { coalesceKey: 'drag' });
    stack.endCoalescing();
    stack.push('c', { coalesceKey: 'drag' });

    expect(stack.undoDepth).toBe(2);
  });

  it('honours the history limit', () => {
    const stack = new UndoStack(0, 2);
    stack.push(1);
    stack.push(2);
    stack.push(3);

    expect(stack.undoDepth).toBe(2);
    stack.undo();
    stack.undo();

    expect(stack.present).toBe(1);
    expect(stack.canUndo).toBe(false);
  });

  it('clears history but keeps the present', () => {
    const stack = new UndoStack('a');
    stack.push('b');
    stack.clear();

    expect(stack.present).toBe('b');
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });
});
