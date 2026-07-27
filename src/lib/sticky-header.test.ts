import { describe, expect, test } from 'vitest';

import { getStickyHeaderState } from './sticky-header';

describe('getStickyHeaderState', () => {
  test('stays shown while at/near the top of the page', () => {
    expect(getStickyHeaderState(0, 0, 180)).toBe('shown');
    expect(getStickyHeaderState(150, 100, 180)).toBe('shown');
  });

  test('hides when scrolling down past the threshold', () => {
    expect(getStickyHeaderState(200, 100, 180)).toBe('hidden');
  });

  test('shows when scrolling up, even past the threshold', () => {
    expect(getStickyHeaderState(300, 400, 180)).toBe('shown');
  });

  test('stays shown when scroll position is unchanged', () => {
    expect(getStickyHeaderState(300, 300, 180)).toBe('shown');
  });
});
