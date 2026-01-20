/**
 * SVG rendering functions for rooms.
 */

import { Room, AppState } from '../model/types';
import { SCALE } from '../utils/scale';

export interface RenderOptions {
  selectedRoomId: string | null;
  hoveredRoomId: string | null;
  snapIndicators?: { xCm?: number; yCm?: number; snappedX: boolean; snappedY: boolean };
}

export interface RoomLabelPosition {
  roomId: string;
  screenX: number;
  screenY: number;
  isSelected: boolean;
}

/**
 * Calculate screen-space position for room name labels.
 * Used for fixed-size HTML overlay so labels are readable at any zoom level.
 * 
 * This function calculates where to place HTML label elements that overlay the SVG.
 * Since the SVG applies transform: translate(panX, panY) scale(zoom) to a <g> element,
 * we need to replicate that transformation in reverse to find screen coordinates.
 */
export function calculateRoomLabelPositions(
  rooms: Room[],
  panX: number,
  panY: number,
  zoom: number,
  selectedRoomId: string | null
): RoomLabelPosition[] {
  return rooms.map((room) => {
    // Room content-space coordinates (in pixels, where SCALE = 5)
    const xPx = room.xCm * SCALE;
    const yPx = room.yCm * SCALE;
    const wPx = room.widthCm * SCALE;

    // Center of the room in content-space
    const centerXContent = xPx + wPx / 2;
    const topYContent = yPx;

    // Apply the SVG transform: translate(panX, panY) scale(zoom)
    // screenCoord = panX + zoom * contentCoord
    const screenX = panX + zoom * centerXContent;
    const screenY = panY + zoom * topYContent;

    return {
      roomId: room.id,
      screenX,
      screenY,
      isSelected: room.id === selectedRoomId,
    };
  });
}

/**
 * Generate SVG rect element for a room.
 */
export function renderRoom(
  room: Room,
  isSelected: boolean,
  isHovered: boolean
): string {
  const x = room.xCm * SCALE;
  const y = room.yCm * SCALE;
  const width = room.widthCm * SCALE;
  const height = room.heightCm * SCALE;

  const strokeColor = isSelected ? '#2563eb' : isHovered ? '#9333ea' : '#d1d5db';
  const strokeWidth = isSelected ? 3 : 2;
  const fillColor = isSelected ? 'rgba(37, 99, 235, 0.1)' : 'rgba(229, 231, 235, 0.5)';

  // Room rectangle
  let svg = `<rect 
    x="${x}" 
    y="${y}" 
    width="${width}" 
    height="${height}" 
    fill="${fillColor}" 
    stroke="${strokeColor}" 
    stroke-width="${strokeWidth}"
    data-room-id="${room.id}"
    class="room-rect"
    style="cursor: grab;"
  />`;

  // Room label (name + dimensions)
  const textX = x + width / 2;
  const textY = y + height / 2;
  const labelText = `${room.name}\n${room.widthCm}cm × ${room.heightCm}cm`;

  svg += `<text 
    x="${textX}" 
    y="${textY}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-size="12"
    font-weight="500"
    fill="#374151"
    pointer-events="none"
    data-room-id="${room.id}"
  >`;

  // Split text into multiple tspan for each line
  const lines = labelText.split('\n');
  lines.forEach((line, idx) => {
    const offset = (idx - (lines.length - 1) / 2) * 16;
    svg += `<tspan x="${textX}" dy="${idx === 0 ? offset : 16}">${escapeXml(line)}</tspan>`;
  });

  svg += `</text>`;

  return svg;
}

/**
 * Escape XML special characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate snap indicator lines (visual feedback during drag).
 */
export function renderSnapIndicators(
  snapResult: { xCm?: number; yCm?: number; snappedX: boolean; snappedY: boolean },
  canvasWidth: number,
  canvasHeight: number
): string {
  let svg = '';

  if (snapResult.snappedX && snapResult.xCm !== undefined) {
    const x = snapResult.xCm * SCALE;
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${canvasHeight}" 
      stroke="#ec4899" stroke-width="1" stroke-dasharray="4,4" opacity="0.6" 
      pointer-events="none" />`;
  }

  if (snapResult.snappedY && snapResult.yCm !== undefined) {
    const y = snapResult.yCm * SCALE;
    svg += `<line x1="0" y1="${y}" x2="${canvasWidth}" y2="${y}" 
      stroke="#ec4899" stroke-width="1" stroke-dasharray="4,4" opacity="0.6" 
      pointer-events="none" />`;
  }

  return svg;
}

/**
 * Generate the full SVG content for the canvas.
 */
export function renderSvgContent(
  state: AppState,
  canvasWidth: number,
  canvasHeight: number,
  snapResult?: { xCm?: number; yCm?: number; snappedX: boolean; snappedY: boolean }
): string {
  let content = '';

  // Render all rooms
  for (const room of state.rooms) {
    const isSelected = state.selectedRoomIds.includes(room.id);
    content += renderRoom(room, isSelected, false);
  }

  // Render snap indicators if provided
  if (snapResult && (snapResult.snappedX || snapResult.snappedY)) {
    content += renderSnapIndicators(snapResult, canvasWidth, canvasHeight);
  }

  return content;
}
