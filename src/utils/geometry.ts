/**
 * Geometric utilities for room planning.
 */

import { Room } from '../model/types';
import { SCALE } from './scale';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convert a room from cm to a pixel-based rectangle.
 */
export function roomToRect(room: Room): Rect {
  return {
    x: room.xCm * SCALE,
    y: room.yCm * SCALE,
    width: room.widthCm * SCALE,
    height: room.heightCm * SCALE,
  };
}

/**
 * Check if two rectangles overlap.
 */
export function rectsOverlap(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Check if a point is inside a rectangle.
 */
export function pointInRect(x: number, y: number, rect: Rect): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * Get the center of a rectangle.
 */
export function getRectCenter(rect: Rect): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Calculate distance between two points.
 */
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
