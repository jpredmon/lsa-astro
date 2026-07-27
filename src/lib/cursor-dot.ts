export interface DotPosition {
  top: number;
  left: number;
}

export interface DotSize {
  width: number;
  height: number;
  opacity: number;
}

const BASE_SIZE = 10;
const HOVER_SIZE = 70;
const BASE_OPACITY = 1;
const HOVER_OPACITY = 0.2;

export function computeDotPosition(
  clientX: number,
  clientY: number,
  width: number,
  height: number
): DotPosition {
  return {
    top: clientY - height / 2,
    left: clientX - width / 2,
  };
}

export function getDotSize(isHovering: boolean): DotSize {
  return isHovering
    ? { width: HOVER_SIZE, height: HOVER_SIZE, opacity: HOVER_OPACITY }
    : { width: BASE_SIZE, height: BASE_SIZE, opacity: BASE_OPACITY };
}
