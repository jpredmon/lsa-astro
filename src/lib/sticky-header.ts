export type StickyHeaderState = 'shown' | 'hidden';

/**
 * Confirmed live on skatelawrence.com: the header stays shown near the top
 * of the page, hides on scroll-down past its own height, and reappears
 * immediately on scroll-up regardless of position.
 */
export function getStickyHeaderState(
  currentScrollY: number,
  lastScrollY: number,
  hideThreshold: number
): StickyHeaderState {
  if (currentScrollY <= hideThreshold) return 'shown';
  if (currentScrollY > lastScrollY) return 'hidden';
  return 'shown';
}
