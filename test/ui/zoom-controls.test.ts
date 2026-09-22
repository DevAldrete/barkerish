import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../src/ui/zoom-controls.js';
import type { ZoomControls } from '../../src/ui/zoom-controls.js';
import { MAX_ZOOM, MIN_ZOOM } from '../../src/domain/model.js';

describe('<zoom-controls>', () => {
  let element: ZoomControls | undefined;

  afterEach(() => {
    element?.remove();
    element = undefined;
  });

  async function mount(zoom: number): Promise<ZoomControls> {
    element = document.createElement('zoom-controls');
    element.zoom = zoom;
    document.body.append(element);
    await element.updateComplete;
    return element;
  }

  it('shows the zoom percentage', async () => {
    const controls = await mount(1.5);
    expect(controls.shadowRoot?.textContent).toContain('150%');
  });

  it('emits zoom-in and zoom-out events', async () => {
    const controls = await mount(1);
    const listener = vi.fn();
    controls.addEventListener('zoom-in', listener);
    controls.addEventListener('zoom-out', listener);

    const buttons = controls.shadowRoot!.querySelectorAll('button');
    buttons[0]!.click();
    buttons[1]!.click();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('emits an absolute zoom when the slider moves', async () => {
    const controls = await mount(1);
    const listener = vi.fn();
    controls.addEventListener('zoom', listener);

    const slider = controls.shadowRoot!.querySelector('input[type="range"]') as HTMLInputElement;
    slider.value = slider.max;
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    const detail = listener.mock.calls[0]?.[0]?.detail as number;
    expect(detail).toBeCloseTo(MAX_ZOOM, 5);
  });

  it('maps the minimum slider position to the minimum zoom', async () => {
    const controls = await mount(1);
    const listener = vi.fn();
    controls.addEventListener('zoom', listener);

    const slider = controls.shadowRoot!.querySelector('input[type="range"]') as HTMLInputElement;
    slider.value = '0';
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    expect(listener.mock.calls[0]?.[0]?.detail as number).toBeCloseTo(MIN_ZOOM, 5);
  });
});
