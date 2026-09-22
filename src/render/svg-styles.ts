import { css } from 'lit';

/**
 * Styles for the rendered scene. Shared by the canvas and the SVG exporter so an
 * exported file looks the same as the editor.
 */
export const SVG_STYLES = css`
  .grid {
    opacity: 0.9;
  }

  .grid__line {
    stroke: #e2e8f0;
    stroke-width: 1;
  }

  .entity {
    cursor: move;
  }

  .entity__body {
    fill: #ffffff;
    stroke: #94a3b8;
    stroke-width: 1.5;
  }

  .entity__header {
    fill: #e2e8f0;
    stroke: #94a3b8;
    stroke-width: 1.5;
  }

  .entity__name {
    fill: #0f172a;
    font-size: 14px;
    font-weight: 600;
  }

  .attribute__marker {
    fill: #475569;
    font-size: 12px;
    font-weight: 700;
  }

  .attribute__name {
    fill: #1e293b;
    font-size: 12px;
  }

  .attribute__type {
    fill: #64748b;
    font-size: 11px;
  }

  .attribute__unique {
    fill: #7c3aed;
    font-size: 10px;
    font-weight: 700;
  }

  .entity.is-selected .entity__body {
    stroke: #2563eb;
    stroke-width: 2.5;
  }

  .relationship__line {
    stroke: #64748b;
    stroke-width: 1.5;
    fill: none;
  }

  .relationship__hit {
    stroke: transparent;
    stroke-width: 14;
    fill: none;
    cursor: pointer;
  }

  .relationship__crowfoot,
  .relationship__bar {
    stroke: #475569;
    stroke-width: 1.5;
    fill: none;
  }

  .relationship__label {
    fill: #475569;
    font-size: 11px;
    pointer-events: none;
  }

  .relationship.is-selected .relationship__line,
  .relationship.is-selected .relationship__crowfoot,
  .relationship.is-selected .relationship__bar {
    stroke: #2563eb;
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
