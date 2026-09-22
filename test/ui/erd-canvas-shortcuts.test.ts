import { describe, expect, it } from 'vitest';
import { isEditableTarget } from '../../src/ui/erd-canvas.js';

function capture(eventTarget: EventTarget): boolean {
  let result = false;
  const listener = (event: Event): void => {
    result = isEditableTarget(event);
  };
  window.addEventListener('keydown', listener);
  eventTarget.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, composed: true }),
  );
  window.removeEventListener('keydown', listener);
  return result;
}

function shadowHost(...children: HTMLElement[]): HTMLDivElement {
  const host = document.createElement('div');
  host.attachShadow({ mode: 'open' }).append(...children);
  document.body.append(host);
  return host;
}

describe('isEditableTarget', () => {
  it('detects an input nested in a shadow root', () => {
    const input = document.createElement('input');
    shadowHost(input);

    expect(capture(input)).toBe(true);
  });

  it('detects a textarea and a select', () => {
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    shadowHost(textarea, select);

    expect(capture(textarea)).toBe(true);
    expect(capture(select)).toBe(true);
  });

  it('is false for the canvas background', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.append(svg);

    expect(capture(svg)).toBe(false);
    svg.remove();
  });
});
