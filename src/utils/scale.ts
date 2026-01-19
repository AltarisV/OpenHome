/**
 * Scaling utilities: convert between centimeters and pixels.
 * SCALE factor: 1 cm = SCALE pixels (e.g., 1 cm = 5 px)
 */

export const SCALE = 5; // pixels per centimeter

/**
 * Convert centimeters to pixels.
 */
export function cmToPixels(cm: number): number {
  return cm * SCALE;
}

/**
 * Convert pixels to centimeters.
 */
export function pixelsToCm(pixels: number): number {
  return pixels / SCALE;
}

/**
 * Snap a position in pixels to the nearest centimeter.
 */
export function snapToNearestCm(pixels: number): number {
  const cm = pixelsToCm(pixels);
  return Math.round(cm) * SCALE;
}
