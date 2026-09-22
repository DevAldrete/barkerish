import { css } from 'lit';

/**
 * Shared component styles. Global CSS does not cross shadow boundaries, so each
 * component must opt in to border-box sizing and consistent focus rings.
 */
export const BASE_STYLES = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  [tabindex]:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 1px;
  }
`;
