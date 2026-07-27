import { describe, expect, test } from 'vitest';

import { computeDotPosition, getDotSize } from './cursor-dot';

describe('computeDotPosition', () => {
  test('centers the dot on the cursor coordinates', () => {
    const result = computeDotPosition(100, 200, 10, 10);
    expect(result).toEqual({ top: 195, left: 95 });
  });

  test('accounts for the larger hover size when centering', () => {
    const result = computeDotPosition(100, 200, 70, 70);
    expect(result).toEqual({ top: 165, left: 65 });
  });
});

describe('getDotSize', () => {
  test('returns the base 10px size and full opacity when not hovering', () => {
    expect(getDotSize(false)).toEqual({ width: 10, height: 10, opacity: 1 });
  });

  test('returns the 70px hover size and reduced opacity when hovering', () => {
    expect(getDotSize(true)).toEqual({ width: 70, height: 70, opacity: 0.2 });
  });
});
