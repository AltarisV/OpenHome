/**
 * Core TypeScript types for the room planning app.
 * All dimensions are in centimeters (cm).
 */

export interface WallThickness {
  north?: number; // cm, optional override
  south?: number; // cm, optional override
  east?: number; // cm, optional override
  west?: number; // cm, optional override
}

export interface Room {
  id: string;
  name: string;
  xCm: number; // left edge position in cm
  yCm: number; // top edge position in cm
  widthCm: number; // width in cm
  heightCm: number; // height in cm
  wallThickness?: WallThickness; // optional per-wall overrides
}

export interface ObjectDef {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  // future: shape type, metadata
}

export interface PlacedObject {
  id: string;
  defId: string;
  roomId: string; // which room it's placed in
  xCm: number; // position in cm (absolute, same coordinate space as rooms)
  yCm: number;
  rotationDeg?: number;
}

export interface AppState {
  rooms: Room[];
  globalWallThicknessCm: number; // default wall thickness in cm
  selectedRoomId: string | null;
  panX: number; // SVG pan offset in pixels
  panY: number; // SVG pan offset in pixels
  zoom: number; // zoom level (1 = 100%)
  objectDefs?: ObjectDef[];
  placedObjects?: PlacedObject[];
}

export interface DragState {
  roomId: string; // Can be a real room ID or '__pan__' for panning
  startX: number; // starting mouse X in SVG coords (or clientX for pan)
  startY: number; // starting mouse Y in SVG coords (or clientY for pan)
  roomStartX: number; // room's xCm at drag start (or panX for pan)
  roomStartY: number; // room's yCm at drag start (or panY for pan)
}

export type DragTargetType = 'room' | 'placed' | 'pan';

export interface ExtendedDragState extends DragState {
  targetType?: DragTargetType;
}

export interface SnapPoint {
  xCm?: number;
  yCm?: number;
  snap: boolean;
}
