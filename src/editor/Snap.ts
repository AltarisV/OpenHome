/**
 * Snapping logic for room edges (OUTER footprint incl. walls).
 * Snap tolerance: 2 cm
 *
 * Assumption (based on your latest change request):
 * - room.xCm / room.yCm / widthCm / heightCm describe the INNER room rectangle
 * - walls are drawn OUTSIDE the inner rectangle
 * - snapping should therefore align OUTER wall edges (typical floor plan behaviour)
 */

import { Room } from '../model/types';

export const SNAP_TOLERANCE_CM = 2;

export interface SnapResult {
  xCm: number;
  yCm: number;
  snappedX: boolean;
  snappedY: boolean;
  // Optional: expose the snapped guide positions (outer edge) for your indicator lines
  xGuideCm?: number;
  yGuideCm?: number;
}

type WallSides = { north: number; south: number; east: number; west: number };

function getWallThicknessCm(room: Room, globalWallThicknessCm: number): WallSides {
  return {
    north: room.wallThickness?.north ?? globalWallThicknessCm,
    south: room.wallThickness?.south ?? globalWallThicknessCm,
    east: room.wallThickness?.east ?? globalWallThicknessCm,
    west: room.wallThickness?.west ?? globalWallThicknessCm,
  };
}

function outerBoundsCm(
  room: Room,
  globalWallThicknessCm: number,
  // allow overriding x/y when evaluating a dragged target
  xCm: number = room.xCm,
  yCm: number = room.yCm
) {
  const w = getWallThicknessCm(room, globalWallThicknessCm);

  const left = xCm - w.west;
  const right = xCm + room.widthCm + w.east;
  const top = yCm - w.north;
  const bottom = yCm + room.heightCm + w.south;

  return { left, right, top, bottom, w };
}

/**
 * Calculate snap points for a moving room against all other rooms.
 *
 * IMPORTANT: You must pass globalWallThicknessCm so we can compute outer edges.
 * In your page.tsx change the call to:
 *   const snap = Snap.calculateSnap(room, appState.rooms, xCm, yCm, appState.globalWallThicknessCm);
 */
export function calculateSnap(
  movingRoom: Room,
  allRooms: Room[],
  targetXCm: number,
  targetYCm: number,
  globalWallThicknessCm: number
): SnapResult {
  const others = allRooms.filter((r) => r.id !== movingRoom.id);

  const movingOuter = outerBoundsCm(movingRoom, globalWallThicknessCm, targetXCm, targetYCm);

  let snappedXCm = targetXCm;
  let snappedYCm = targetYCm;
  let snappedX = false;
  let snappedY = false;
  let xGuideCm: number | undefined;
  let yGuideCm: number | undefined;

  // Helper to snap movingOuter.left/right to a target edge, adjusting inner xCm accordingly
  const trySnapX = (movingEdge: 'left' | 'right', targetEdgeValueCm: number) => {
    const movingValue = movingOuter[movingEdge];
    const dist = Math.abs(movingValue - targetEdgeValueCm);
    if (dist <= SNAP_TOLERANCE_CM) {
      // We want movingOuter[movingEdge] == targetEdgeValueCm.
      // Convert that to inner xCm:
      // movingOuter.left  = x - west
      // movingOuter.right = x + width + east
      const w = movingOuter.w;
      if (movingEdge === 'left') {
        snappedXCm = targetEdgeValueCm + w.west;
        xGuideCm = targetEdgeValueCm;
      } else {
        snappedXCm = targetEdgeValueCm - (movingRoom.widthCm + w.east);
        xGuideCm = targetEdgeValueCm;
      }
      snappedX = true;
      // update movingOuter for subsequent snaps to use the new x
      const updated = outerBoundsCm(movingRoom, globalWallThicknessCm, snappedXCm, snappedYCm);
      movingOuter.left = updated.left;
      movingOuter.right = updated.right;
      movingOuter.top = updated.top;
      movingOuter.bottom = updated.bottom;
      movingOuter.w = updated.w;
      return true;
    }
    return false;
  };

  const trySnapY = (movingEdge: 'top' | 'bottom', targetEdgeValueCm: number) => {
    const movingValue = movingOuter[movingEdge];
    const dist = Math.abs(movingValue - targetEdgeValueCm);
    if (dist <= SNAP_TOLERANCE_CM) {
      const w = movingOuter.w;
      if (movingEdge === 'top') {
        snappedYCm = targetEdgeValueCm + w.north;
        yGuideCm = targetEdgeValueCm;
      } else {
        snappedYCm = targetEdgeValueCm - (movingRoom.heightCm + w.south);
        yGuideCm = targetEdgeValueCm;
      }
      snappedY = true;
      const updated = outerBoundsCm(movingRoom, globalWallThicknessCm, snappedXCm, snappedYCm);
      movingOuter.left = updated.left;
      movingOuter.right = updated.right;
      movingOuter.top = updated.top;
      movingOuter.bottom = updated.bottom;
      movingOuter.w = updated.w;
      return true;
    }
    return false;
  };

  for (const other of others) {
    const o = outerBoundsCm(other, globalWallThicknessCm);

    // Snap X: moving left/right to other left/right
    if (!snappedX) {
      // moving left to other right OR other left
      if (trySnapX('left', o.right) || trySnapX('left', o.left)) {
        // snapped
      } else if (trySnapX('right', o.left) || trySnapX('right', o.right)) {
        // snapped
      }
    }

    // Snap Y: moving top/bottom to other top/bottom
    if (!snappedY) {
      if (trySnapY('top', o.bottom) || trySnapY('top', o.top)) {
        // snapped
      } else if (trySnapY('bottom', o.top) || trySnapY('bottom', o.bottom)) {
        // snapped
      }
    }

    if (snappedX && snappedY) break;
  }

  return {
    xCm: snappedXCm,
    yCm: snappedYCm,
    snappedX,
    snappedY,
    xGuideCm,
    yGuideCm,
  };
}

/**
 * Calculate snapping for a placed object inside a room so it aligns to inner walls.
 * Snaps object's left/right/top/bottom edges to the room inner edges when within tolerance.
 */
export function calculatePlacedObjectSnap(
  objWidthCm: number,
  objHeightCm: number,
  room: Room,
  targetXCm: number,
  targetYCm: number,
  toleranceCm: number = 5
): SnapResult {
  let snappedX = false;
  let snappedY = false;
  let snappedXCm = targetXCm;
  let snappedYCm = targetYCm;
  let xGuideCm: number | undefined;
  let yGuideCm: number | undefined;

  // Room inner edges
  const leftEdge = room.xCm;
  const rightEdge = room.xCm + room.widthCm;
  const topEdge = room.yCm;
  const bottomEdge = room.yCm + room.heightCm;

  // Object edges at target
  const objLeft = targetXCm;
  const objRight = targetXCm + objWidthCm;
  const objTop = targetYCm;
  const objBottom = targetYCm + objHeightCm;

  // Snap X: left edge to room left, or right edge to room right
  const distLeft = Math.abs(objLeft - leftEdge);
  const distRight = Math.abs(objRight - rightEdge);
  if (distLeft <= toleranceCm && distLeft <= distRight) {
    snappedXCm = leftEdge;
    snappedX = true;
    xGuideCm = leftEdge;
  } else if (distRight <= toleranceCm) {
    snappedXCm = rightEdge - objWidthCm;
    snappedX = true;
    xGuideCm = rightEdge;
  }

  // Snap Y: top edge to room top, or bottom edge to room bottom
  const distTop = Math.abs(objTop - topEdge);
  const distBottom = Math.abs(objBottom - bottomEdge);
  if (distTop <= toleranceCm && distTop <= distBottom) {
    snappedYCm = topEdge;
    snappedY = true;
    yGuideCm = topEdge;
  } else if (distBottom <= toleranceCm) {
    snappedYCm = bottomEdge - objHeightCm;
    snappedY = true;
    yGuideCm = bottomEdge;
  }

  return {
    xCm: snappedXCm,
    yCm: snappedYCm,
    snappedX,
    snappedY,
    xGuideCm,
    yGuideCm,
  };
}
