/**
 * Interaction helpers for SVG pointer events (drag, pan, zoom).
 *
 * IMPORTANT: In your page.tsx, rooms are rendered inside:
 *   <g transform={`translate(panX panY) scale(zoom)`}>
 *
 * That means:
 * - The room geometry (xCm * SCALE) is in "content space"
 * - Pointer coordinates from getScreenCTM() are in the SVG root user space
 * - So we must convert root-space -> content-space by inverting the pan/zoom:
 *     contentX = (rootX - panX) / zoom
 *     contentY = (rootY - panY) / zoom
 */

import type React from 'react';
import { DragState, Room, PlacedObject } from '../model/types';
import { pixelsToCm } from '../utils/scale';

/**
 * We accept both MouseEvent and PointerEvent so you can use either.
 * (Your page.tsx uses PointerEvent now.)
 */
type SvgInputEvent =
  | React.PointerEvent<SVGSVGElement>
  | React.MouseEvent<SVGSVGElement>;

/**
 * Get the pointer position in SVG *content space* (the coordinate system inside the <g transform=...>).
 */
export function getSvgCoordinates(
  event: SvgInputEvent,
  svgElement: SVGSVGElement,
  panX: number,
  panY: number,
  zoom: number
): { x: number; y: number } {
  const pt = svgElement.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;

  const ctm = svgElement.getScreenCTM();

  // Fallback if getScreenCTM fails
  if (!ctm) {
    const rect = svgElement.getBoundingClientRect();
    const rootX = event.clientX - rect.left;
    const rootY = event.clientY - rect.top;

    return {
      x: (rootX - panX) / zoom,
      y: (rootY - panY) / zoom,
    };
  }

  // root-space SVG coords
  const root = pt.matrixTransform(ctm.inverse());

  // convert root-space -> content-space (inverse of <g transform="translate(pan) scale(zoom)">)
  return {
    x: (root.x - panX) / zoom,
    y: (root.y - panY) / zoom,
  };
}

/**
 * Convert SVG pixel coordinates to centimeters.
 */
export function svgPixelsToCm(x: number, y: number): { xCm: number; yCm: number } {
  return {
    xCm: pixelsToCm(x),
    yCm: pixelsToCm(y),
  };
}

/**
 * Find which room was clicked, if any (model-space hit test).
 * Note: This expects xCm/yCm to already be in cm.
 */
export function findRoomAtPoint(rooms: Room[], xCm: number, yCm: number): Room | undefined {
  for (let i = rooms.length - 1; i >= 0; i--) {
    const room = rooms[i];
    if (
      xCm >= room.xCm &&
      xCm <= room.xCm + room.widthCm &&
      yCm >= room.yCm &&
      yCm <= room.yCm + room.heightCm
    ) {
      return room;
    }
  }
  return undefined;
}

/**
 * Initialize a drag state for a room.
 * svgX/svgY must be in content-space pixels.
 */
export function startDrag(room: Room, svgX: number, svgY: number): DragState {
  return {
    roomId: room.id,
    startX: svgX,
    startY: svgY,
    roomStartX: room.xCm,
    roomStartY: room.yCm,
  };
}

/**
 * Initialize a drag state for a placed object.
 * svgX/svgY must be in content-space pixels.
 */
export function startPlacedDrag(placed: PlacedObject, svgX: number, svgY: number): DragState {
  return {
    roomId: placed.id,
    startX: svgX,
    startY: svgY,
    roomStartX: placed.xCm,
    roomStartY: placed.yCm,
  };
}

/**
 * Calculate the new room position (cm) based on drag movement in content-space pixels.
 */
export function calculateDragPosition(
  dragState: DragState,
  currentSvgX: number,
  currentSvgY: number
): { xCm: number; yCm: number } {
  const deltaXpx = currentSvgX - dragState.startX;
  const deltaYpx = currentSvgY - dragState.startY;

  const deltaCmX = pixelsToCm(deltaXpx);
  const deltaCmY = pixelsToCm(deltaYpx);

  return {
    xCm: dragState.roomStartX + deltaCmX,
    yCm: dragState.roomStartY + deltaCmY,
  };
}

/**
 * Constrain room position to prevent negative coordinates.
 */
export function constrainRoomPosition(
  xCm: number,
  yCm: number,
  minCm: number = 0
): { xCm: number; yCm: number } {
  return {
    xCm: Math.max(minCm, xCm),
    yCm: Math.max(minCm, yCm),
  };
}
