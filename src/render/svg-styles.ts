import { css } from 'lit';

/**
 * Styles for the rendered scene. Shared by the canvas and the SVG exporter so an
 * exported file looks the same as the editor. Colours come from theme tokens.
 */
export const SVG_STYLES = css`
  .grid {
    opacity: 0.9;
  }

  .grid__line {
    stroke: var(--erd-grid);
    stroke-width: 1;
  }

  .entity {
    cursor: move;
  }

  .entity__body {
    fill: var(--erd-entity-fill);
    stroke: var(--erd-entity-stroke);
    stroke-width: 1.5;
  }

  .entity__header {
    fill: var(--erd-entity-header);
    stroke: var(--erd-entity-stroke);
    stroke-width: 1.5;
  }

  .entity__name {
    fill: var(--erd-text);
    font-size: 14px;
    font-weight: 600;
  }

  .attribute__marker {
    fill: var(--erd-marker);
    font-size: 12px;
    font-weight: 700;
  }

  .attribute__name {
    fill: var(--erd-attribute);
    font-size: 12px;
  }

  .attribute__type {
    fill: var(--erd-attribute-type);
    font-size: 11px;
  }

  .attribute__unique {
    fill: var(--erd-unique);
    font-size: 10px;
    font-weight: 700;
  }

  .entity.is-selected .entity__body {
    stroke: var(--erd-accent);
    stroke-width: 2.5;
  }

  .relationship__line {
    stroke: var(--erd-relationship);
    stroke-width: 1.5;
    fill: none;
  }

  .relationship__hit {
    stroke: transparent;
    stroke-width: 16;
    fill: none;
    pointer-events: stroke;
    cursor: pointer;
  }

  .relationship__crowfoot,
  .relationship__bar {
    stroke: var(--erd-relationship-strong);
    stroke-width: 1.5;
    fill: none;
  }

  .relationship__label {
    fill: var(--erd-label);
    font-size: 11px;
    pointer-events: none;
  }

  .relationship.is-selected .relationship__line,
  .relationship.is-selected .relationship__crowfoot,
  .relationship.is-selected .relationship__bar {
    stroke: var(--erd-accent);
    stroke-width: 2.5;
  }

  text {
    font-family:
      system-ui,
      -apple-system,
      'Segoe UI',
      sans-serif;
  }
`;
