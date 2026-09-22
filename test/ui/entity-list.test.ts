import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../src/ui/entity-list.js';
import type { EntityList } from '../../src/ui/entity-list.js';
import { createEntity } from '../../src/domain/model.js';

const entities = [
  createEntity({ id: 'e1', name: 'Customer', attributes: [] }),
  createEntity({ id: 'e2', name: 'Order', attributes: [] }),
];

describe('<entity-list>', () => {
  let element: EntityList | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  async function mount(selectedId: string | null = null): Promise<EntityList> {
    element = document.createElement('entity-list');
    element.entities = entities;
    element.selectedId = selectedId;
    document.body.append(element);
    await element.updateComplete;
    return element;
  }

  it('lists entity names with a count', async () => {
    const list = await mount();

    const text = list.shadowRoot?.textContent ?? '';
    expect(text).toContain('Customer');
    expect(text).toContain('Order');
    expect(list.shadowRoot?.querySelector('.count')?.textContent?.trim()).toBe('2');
  });

  it('shows an empty message when there are no entities', async () => {
    element = document.createElement('entity-list');
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('.empty')).toBeTruthy();
  });

  it('marks the selected entity', async () => {
    const list = await mount('e2');

    expect(list.shadowRoot?.querySelectorAll('li.current')).toHaveLength(1);
    expect(list.shadowRoot?.querySelector('li.current .open')?.textContent?.trim()).toBe('Order');
  });

  it('emits select when a row is clicked', async () => {
    const list = await mount();
    const listener = vi.fn();
    list.addEventListener('select', listener);

    list.shadowRoot!.querySelectorAll('.open')[0]!.dispatchEvent(new MouseEvent('click'));

    expect((listener.mock.calls[0]?.[0] as CustomEvent<string>).detail).toBe('e1');
  });

  it('emits fit, edit and delete from the row actions', async () => {
    const list = await mount();
    const events: string[] = [];
    for (const type of ['fit', 'edit', 'delete']) {
      list.addEventListener(type, (event) => events.push((event as CustomEvent<string>).detail));
    }

    const buttons = list.shadowRoot!.querySelectorAll('li:first-child .icon');
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();
    (buttons[2] as HTMLButtonElement).click();

    expect(events).toEqual(['e1', 'e1', 'e1']);
  });
});
