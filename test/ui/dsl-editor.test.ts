import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../src/ui/dsl-editor.js';
import type { DslEditor } from '../../src/ui/dsl-editor.js';

describe('<dsl-editor>', () => {
  let element: DslEditor | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  async function mount(text = ''): Promise<DslEditor> {
    element = document.createElement('dsl-editor');
    element.text = text;
    document.body.append(element);
    await element.updateComplete;
    return element;
  }

  it('shows the provided text', async () => {
    const editor = await mount('diagram "D" { entity A { id: integer pk } }');
    const textarea = editor.shadowRoot!.querySelector('textarea')!;

    expect(textarea.value).toContain('diagram "D"');
  });

  it('disables Apply and lists errors for invalid text', async () => {
    const editor = await mount('entity A { id: integer pk }');

    const apply = editor.shadowRoot!.querySelector('button.primary') as HTMLButtonElement;
    expect(apply.disabled).toBe(true);
    expect(editor.shadowRoot!.querySelectorAll('.errors li')).toHaveLength(1);
  });

  it('emits apply with the current text', async () => {
    const editor = await mount('diagram "D" { entity A { id: integer pk } }');
    const listener = vi.fn();
    editor.addEventListener('apply', listener);

    (editor.shadowRoot!.querySelector('button.primary') as HTMLButtonElement).click();

    expect((listener.mock.calls[0]?.[0] as CustomEvent<string>).detail).toContain('diagram "D"');
  });

  it('applies on Cmd/Ctrl+Enter', async () => {
    const editor = await mount('diagram "D" { entity A { id: integer pk } }');
    const listener = vi.fn();
    editor.addEventListener('apply', listener);

    editor
      .shadowRoot!.querySelector('textarea')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true }));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('emits refresh, save-file and load-file', async () => {
    const editor = await mount('diagram "D" {}');
    const refresh = vi.fn();
    const save = vi.fn();
    const load = vi.fn();
    editor.addEventListener('refresh', refresh);
    editor.addEventListener('save-file', save);
    editor.addEventListener('load-file', load);

    const buttons = editor.shadowRoot!.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();
    (buttons[2] as HTMLButtonElement).click();

    const fileInput = editor.shadowRoot!.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { value: [new File(['x'], 'd.txt')] });
    fileInput.dispatchEvent(new Event('change'));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
