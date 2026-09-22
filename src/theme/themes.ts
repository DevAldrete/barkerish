/**
 * Design tokens shared by the UI and the SVG renderer. Themes are applied as CSS
 * custom properties on the document root, so they are inherited into every shadow
 * root. The same values are serialized into exported SVGs.
 */
export interface ThemeTokens {
  '--erd-bg': string;
  '--erd-surface': string;
  '--erd-surface-2': string;
  '--erd-border': string;
  '--erd-border-strong': string;
  '--erd-text': string;
  '--erd-text-muted': string;
  '--erd-text-subtle': string;
  '--erd-accent': string;
  '--erd-accent-strong': string;
  '--erd-accent-contrast': string;
  '--erd-accent-soft': string;
  '--erd-danger': string;
  '--erd-danger-soft': string;
  '--erd-entity-fill': string;
  '--erd-entity-stroke': string;
  '--erd-entity-header': string;
  '--erd-attribute': string;
  '--erd-attribute-type': string;
  '--erd-marker': string;
  '--erd-unique': string;
  '--erd-relationship': string;
  '--erd-relationship-strong': string;
  '--erd-label': string;
  '--erd-grid': string;
  '--erd-shadow': string;
}

export interface ThemeDefinition {
  label: string;
  tokens: ThemeTokens;
}

const definitions = {
  light: {
    label: 'Light',
    tokens: {
      '--erd-bg': '#f8fafc',
      '--erd-surface': '#ffffff',
      '--erd-surface-2': '#f8fafc',
      '--erd-border': '#e2e8f0',
      '--erd-border-strong': '#cbd5e1',
      '--erd-text': '#0f172a',
      '--erd-text-muted': '#475569',
      '--erd-text-subtle': '#94a3b8',
      '--erd-accent': '#2563eb',
      '--erd-accent-strong': '#1d4ed8',
      '--erd-accent-contrast': '#ffffff',
      '--erd-accent-soft': '#dbeafe',
      '--erd-danger': '#b91c1c',
      '--erd-danger-soft': '#fecaca',
      '--erd-entity-fill': '#ffffff',
      '--erd-entity-stroke': '#94a3b8',
      '--erd-entity-header': '#e2e8f0',
      '--erd-attribute': '#1e293b',
      '--erd-attribute-type': '#64748b',
      '--erd-marker': '#475569',
      '--erd-unique': '#7c3aed',
      '--erd-relationship': '#64748b',
      '--erd-relationship-strong': '#475569',
      '--erd-label': '#475569',
      '--erd-grid': '#e2e8f0',
      '--erd-shadow': 'rgb(15 23 42 / 12%)',
    },
  },
  'dark-grey': {
    label: 'Dark Grey',
    tokens: {
      '--erd-bg': '#17191d',
      '--erd-surface': '#1f2227',
      '--erd-surface-2': '#262a30',
      '--erd-border': '#2f343b',
      '--erd-border-strong': '#3d444d',
      '--erd-text': '#e6e9ee',
      '--erd-text-muted': '#a8b0bb',
      '--erd-text-subtle': '#6b7480',
      '--erd-accent': '#6ea8fe',
      '--erd-accent-strong': '#4d8ef7',
      '--erd-accent-contrast': '#0b1220',
      '--erd-accent-soft': '#22314a',
      '--erd-danger': '#f87171',
      '--erd-danger-soft': '#4a2325',
      '--erd-entity-fill': '#1f2227',
      '--erd-entity-stroke': '#3d444d',
      '--erd-entity-header': '#2b3037',
      '--erd-attribute': '#dfe4ea',
      '--erd-attribute-type': '#9aa3ae',
      '--erd-marker': '#a8b0bb',
      '--erd-unique': '#c4a7ff',
      '--erd-relationship': '#8a93a0',
      '--erd-relationship-strong': '#b7bec8',
      '--erd-label': '#a8b0bb',
      '--erd-grid': '#262b31',
      '--erd-shadow': 'rgb(0 0 0 / 50%)',
    },
  },
  ashen: {
    label: 'Ashen',
    tokens: {
      '--erd-bg': '#1b1f1e',
      '--erd-surface': '#232826',
      '--erd-surface-2': '#2a302d',
      '--erd-border': '#353c38',
      '--erd-border-strong': '#465049',
      '--erd-text': '#e3e8e4',
      '--erd-text-muted': '#a4ada7',
      '--erd-text-subtle': '#707a73',
      '--erd-accent': '#8fbf9f',
      '--erd-accent-strong': '#6fa886',
      '--erd-accent-contrast': '#101713',
      '--erd-accent-soft': '#2c3a32',
      '--erd-danger': '#d98b8b',
      '--erd-danger-soft': '#3f2a2a',
      '--erd-entity-fill': '#232826',
      '--erd-entity-stroke': '#465049',
      '--erd-entity-header': '#2c3330',
      '--erd-attribute': '#dbe1dc',
      '--erd-attribute-type': '#98a29b',
      '--erd-marker': '#a4ada7',
      '--erd-unique': '#b9a7d6',
      '--erd-relationship': '#8b958e',
      '--erd-relationship-strong': '#b3bdb6',
      '--erd-label': '#a4ada7',
      '--erd-grid': '#2a302d',
      '--erd-shadow': 'rgb(0 0 0 / 45%)',
    },
  },
  'tokyo-night': {
    label: 'Tokyo Night',
    tokens: {
      '--erd-bg': '#1a1b26',
      '--erd-surface': '#1f2335',
      '--erd-surface-2': '#24283b',
      '--erd-border': '#2f3549',
      '--erd-border-strong': '#3b4261',
      '--erd-text': '#c0caf5',
      '--erd-text-muted': '#9aa5ce',
      '--erd-text-subtle': '#565f89',
      '--erd-accent': '#7aa2f7',
      '--erd-accent-strong': '#5d8bf4',
      '--erd-accent-contrast': '#16161e',
      '--erd-accent-soft': '#283457',
      '--erd-danger': '#f7768e',
      '--erd-danger-soft': '#3b2732',
      '--erd-entity-fill': '#1f2335',
      '--erd-entity-stroke': '#3b4261',
      '--erd-entity-header': '#292e42',
      '--erd-attribute': '#c0caf5',
      '--erd-attribute-type': '#9aa5ce',
      '--erd-marker': '#9aa5ce',
      '--erd-unique': '#bb9af7',
      '--erd-relationship': '#7a82a8',
      '--erd-relationship-strong': '#c0caf5',
      '--erd-label': '#9aa5ce',
      '--erd-grid': '#232433',
      '--erd-shadow': 'rgb(0 0 0 / 50%)',
    },
  },
  catppuccin: {
    label: 'Catppuccin',
    tokens: {
      '--erd-bg': '#1e1e2e',
      '--erd-surface': '#181825',
      '--erd-surface-2': '#313244',
      '--erd-border': '#313244',
      '--erd-border-strong': '#45475a',
      '--erd-text': '#cdd6f4',
      '--erd-text-muted': '#a6adc8',
      '--erd-text-subtle': '#6c7086',
      '--erd-accent': '#89b4fa',
      '--erd-accent-strong': '#74a8f7',
      '--erd-accent-contrast': '#1e1e2e',
      '--erd-accent-soft': '#313d5c',
      '--erd-danger': '#f38ba8',
      '--erd-danger-soft': '#45293a',
      '--erd-entity-fill': '#1e1e2e',
      '--erd-entity-stroke': '#45475a',
      '--erd-entity-header': '#313244',
      '--erd-attribute': '#cdd6f4',
      '--erd-attribute-type': '#a6adc8',
      '--erd-marker': '#a6adc8',
      '--erd-unique': '#cba6f7',
      '--erd-relationship': '#7f849c',
      '--erd-relationship-strong': '#bac2de',
      '--erd-label': '#a6adc8',
      '--erd-grid': '#282838',
      '--erd-shadow': 'rgb(0 0 0 / 50%)',
    },
  },
  gruvbox: {
    label: 'Gruvbox',
    tokens: {
      '--erd-bg': '#282828',
      '--erd-surface': '#32302f',
      '--erd-surface-2': '#3c3836',
      '--erd-border': '#504945',
      '--erd-border-strong': '#665c54',
      '--erd-text': '#ebdbb2',
      '--erd-text-muted': '#bdae93',
      '--erd-text-subtle': '#928374',
      '--erd-accent': '#83a598',
      '--erd-accent-strong': '#8ec07c',
      '--erd-accent-contrast': '#282828',
      '--erd-accent-soft': '#3a4a44',
      '--erd-danger': '#fb4934',
      '--erd-danger-soft': '#4a2b28',
      '--erd-entity-fill': '#32302f',
      '--erd-entity-stroke': '#665c54',
      '--erd-entity-header': '#3c3836',
      '--erd-attribute': '#ebdbb2',
      '--erd-attribute-type': '#bdae93',
      '--erd-marker': '#bdae93',
      '--erd-unique': '#d3869b',
      '--erd-relationship': '#a89984',
      '--erd-relationship-strong': '#ebdbb2',
      '--erd-label': '#bdae93',
      '--erd-grid': '#3a3735',
      '--erd-shadow': 'rgb(0 0 0 / 45%)',
    },
  },
  nord: {
    label: 'Nord',
    tokens: {
      '--erd-bg': '#2e3440',
      '--erd-surface': '#3b4252',
      '--erd-surface-2': '#434c5e',
      '--erd-border': '#4c566a',
      '--erd-border-strong': '#5e6a82',
      '--erd-text': '#eceff4',
      '--erd-text-muted': '#d8dee9',
      '--erd-text-subtle': '#97a0b3',
      '--erd-accent': '#88c0d0',
      '--erd-accent-strong': '#81a1c1',
      '--erd-accent-contrast': '#2e3440',
      '--erd-accent-soft': '#3d4f5c',
      '--erd-danger': '#bf616a',
      '--erd-danger-soft': '#46323a',
      '--erd-entity-fill': '#3b4252',
      '--erd-entity-stroke': '#4c566a',
      '--erd-entity-header': '#434c5e',
      '--erd-attribute': '#eceff4',
      '--erd-attribute-type': '#d8dee9',
      '--erd-marker': '#d8dee9',
      '--erd-unique': '#b48ead',
      '--erd-relationship': '#7d879c',
      '--erd-relationship-strong': '#d8dee9',
      '--erd-label': '#d8dee9',
      '--erd-grid': '#353c4a',
      '--erd-shadow': 'rgb(0 0 0 / 45%)',
    },
  },
} satisfies Record<string, ThemeDefinition>;

export const THEMES = definitions;
export type ThemeId = keyof typeof definitions;
export const DEFAULT_THEME: ThemeId = 'light';

const STORAGE_KEY = 'barkerish:theme';
/**
 * Background and colour-scheme are stored separately so `index.html` can restore
 * them before the bundle loads and avoid a flash of the default theme. Keep these
 * keys in sync with the inline script in `index.html`.
 */
const STORAGE_BG_KEY = 'barkerish:themeBg';
const STORAGE_SCHEME_KEY = 'barkerish:themeScheme';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in THEMES;
}

/** Whether a theme's background is dark, used to set the browser colour scheme. */
function colorSchemeFor(id: ThemeId): 'light' | 'dark' {
  return isDarkColor(THEMES[id].tokens['--erd-bg']) ? 'dark' : 'light';
}

function isDarkColor(color: string): boolean {
  if (!color.startsWith('#') || color.length < 7) {
    return false;
  }
  const value = Number.parseInt(color.slice(1, 7), 16);
  const red = (value >> 16) & 0xff;
  const green = (value >> 8) & 0xff;
  const blue = value & 0xff;
  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255 < 0.5;
}

/** Apply a theme by setting its tokens on the document root. */
export function applyTheme(id: ThemeId): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(THEMES[id].tokens)) {
    root.style.setProperty(name, value);
  }
  root.dataset.theme = id;
  root.style.colorScheme = colorSchemeFor(id);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEMES[id].tokens['--erd-bg']);
}

/** CSS text that defines a theme's variables, for embedding in exported SVGs. */
export function themeVariables(id: ThemeId): string {
  const declarations = Object.entries(THEMES[id].tokens)
    .map(([name, value]) => `${name}:${value};`)
    .join('');
  return `svg{${declarations}}`;
}

export function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemeId(stored)) {
      return stored;
    }
  } catch {
    // Storage may be unavailable; fall back to the default theme.
  }
  return DEFAULT_THEME;
}

export function saveTheme(id: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    localStorage.setItem(STORAGE_BG_KEY, THEMES[id].tokens['--erd-bg']);
    localStorage.setItem(STORAGE_SCHEME_KEY, colorSchemeFor(id));
  } catch {
    // Persisting the theme is a convenience only.
  }
}
