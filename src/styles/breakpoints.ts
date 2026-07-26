/**
 * Documented breakpoint values — Elementor's standard 3-tier breakpoints,
 * confirmed by repeated media-query usage across the live site's stylesheet.
 *
 * CSS custom properties CANNOT be referenced inside an `@media` condition
 * (no browser support). These constants exist for JS use only (matchMedia,
 * responsive component logic). Every `@media` rule anywhere in this codebase
 * MUST hardcode the literal pixel value and reference this file in a comment.
 */
export const BREAKPOINTS = {
  /** `@media (max-width: 767px)` */
  phoneMax: 767,
  /** `@media (min-width: 768px)` */
  tabletMin: 768,
  /** `@media (max-width: 1024px)` */
  tabletMax: 1024,
  /** `@media (min-width: 1025px)` */
  desktopMin: 1025,
} as const;
