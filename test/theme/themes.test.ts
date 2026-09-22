import { afterEach, describe, expect, it } from 'vitest';
import {
  applyTheme,
  DEFAULT_THEME,
  isThemeId,
  loadTheme,
  saveTheme,
  THEMES,
  themeVariables,
} from '../../src/theme/themes.js';

const TOKEN_NAMES = Object.keys(THEMES[DEFAULT_THEME].tokens);

describe('theme definitions', () => {
  it('ships the requested themes', () => {
    expect(Object.keys(THEMES)).toEqual(
      expect.arrayContaining([
        'light',
        'dark-grey',
        'ashen',
        'tokyo-night',
        'catppuccin',
        'gruvbox',
        'nord',
      ]),
    );
  });

  it('defines every token for every theme', () => {
    for (const [id, theme] of Object.entries(THEMES)) {
      expect(Object.keys(theme.tokens), id).toEqual(TOKEN_NAMES);
      for (const [name, value] of Object.entries(theme.tokens)) {
        expect(value, `${id} ${name}`).toMatch(/^(#|rgb)/);
      }
    }
  });
});

describe('applyTheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets tokens on the document root', () => {
    applyTheme('nord');

    const root = document.documentElement;
    expect(root.dataset.theme).toBe('nord');
    expect(root.style.getPropertyValue('--erd-bg')).toBe(THEMES.nord.tokens['--erd-bg']);
  });

  it('sets the browser colour scheme from the theme background', () => {
    applyTheme('nord');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    applyTheme('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});

describe('themeVariables', () => {
  it('emits an svg-scoped rule containing the theme tokens', () => {
    const css = themeVariables('gruvbox');

    expect(css.startsWith('svg{')).toBe(true);
    expect(css).toContain(`--erd-accent:${THEMES.gruvbox.tokens['--erd-accent']};`);
  });
});

describe('theme persistence', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('round-trips a stored theme', () => {
    saveTheme('catppuccin');
    expect(loadTheme()).toBe('catppuccin');
  });

  it('stores the background and scheme for a flash-free reload', () => {
    saveTheme('nord');

    expect(localStorage.getItem('barkerish:themeBg')).toBe(THEMES.nord.tokens['--erd-bg']);
    expect(localStorage.getItem('barkerish:themeScheme')).toBe('dark');
  });

  it('falls back to the default for unknown or missing values', () => {
    localStorage.setItem('barkerish:theme', 'nope');
    expect(loadTheme()).toBe(DEFAULT_THEME);
    localStorage.clear();
    expect(loadTheme()).toBe(DEFAULT_THEME);
  });

  it('validates theme ids', () => {
    expect(isThemeId('nord')).toBe(true);
    expect(isThemeId('nope')).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });
});
