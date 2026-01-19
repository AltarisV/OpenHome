/**
 * State initialization and mutation helpers.
 * All functions are pure and return new state objects.
 */

import { AppState, Room, WallThickness } from './types';
import { ObjectDef, PlacedObject } from './types';

export function createInitialState(): AppState {
  return {
    rooms: [],
    globalWallThicknessCm: 12,
    selectedRoomId: null,
    panX: 50,
    panY: 50,
    zoom: 1,
    objectDefs: [],
    placedObjects: [],
  };
}

/**
 * Add a new room to the state.
 */
export function addRoom(
  state: AppState,
  name: string,
  widthCm: number,
  heightCm: number
): AppState {
  const newRoom: Room = {
    id: `room-${Date.now()}`,
    name,
    xCm: 50, // default starting position
    yCm: 50,
    widthCm,
    heightCm,
  };

  return {
    ...state,
    rooms: [...state.rooms, newRoom],
    selectedRoomId: newRoom.id,
  };
}

/**
 * Add a new object definition to the library
 */
export function addObjectDef(state: AppState, name: string, widthCm: number, heightCm: number): AppState {
  const def: ObjectDef = {
    id: `objdef-${Date.now()}`,
    name,
    widthCm,
    heightCm,
  };

  return {
    ...state,
    objectDefs: [...(state.objectDefs ?? []), def],
  };
}

/**
 * Place an object into a room at absolute coordinates (cm)
 */
export function placeObject(
  state: AppState,
  defId: string,
  roomId: string,
  xCm: number,
  yCm: number
): AppState {
  const placed: PlacedObject = {
    id: `placed-${Date.now()}`,
    defId,
    roomId,
    xCm,
    yCm,
  };

  return {
    ...state,
    placedObjects: [...(state.placedObjects ?? []), placed],
  };
}

export function duplicatePlacedObject(state: AppState, placedId: string, offsetCm = 20): AppState {
  const existing = (state.placedObjects ?? []).find((p) => p.id === placedId);
  if (!existing) return state;
  const copy: PlacedObject = {
    ...existing,
    id: `placed-${Date.now()}`,
    xCm: existing.xCm + offsetCm,
    yCm: existing.yCm + offsetCm,
  };
  return {
    ...state,
    placedObjects: [...(state.placedObjects ?? []), copy],
  };
}

export function updatePlacedObjectPosition(state: AppState, placedId: string, xCm: number, yCm: number): AppState {
  return {
    ...state,
    placedObjects: (state.placedObjects ?? []).map((p) => (p.id === placedId ? { ...p, xCm, yCm } : p)),
  };
}

export function updatePlacedObjectRotation(state: AppState, placedId: string, rotationDeg: number): AppState {
  return {
    ...state,
    placedObjects: (state.placedObjects ?? []).map((p) => (p.id === placedId ? { ...p, rotationDeg } : p)),
  };
}

export function deletePlacedObject(state: AppState, placedId: string): AppState {
  return {
    ...state,
    placedObjects: (state.placedObjects ?? []).filter((p) => p.id !== placedId),
  };
}

/**
 * Delete a room from the state.
 */
export function deleteRoom(state: AppState, roomId: string): AppState {
  return {
    ...state,
    rooms: state.rooms.filter((r) => r.id !== roomId),
    selectedRoomId: state.selectedRoomId === roomId ? null : state.selectedRoomId,
  };
}

/**
 * Update a room's position (when dragging).
 */
export function updateRoomPosition(
  state: AppState,
  roomId: string,
  xCm: number,
  yCm: number
): AppState {
  return {
    ...state,
    rooms: state.rooms.map((r) =>
      r.id === roomId ? { ...r, xCm, yCm } : r
    ),
  };
}

/**
 * Update a room's dimensions.
 */
export function updateRoomDimensions(
  state: AppState,
  roomId: string,
  widthCm: number,
  heightCm: number
): AppState {
  return {
    ...state,
    rooms: state.rooms.map((r) =>
      r.id === roomId ? { ...r, widthCm, heightCm } : r
    ),
  };
}

/**
 * Update a room's name.
 */
export function updateRoomName(
  state: AppState,
  roomId: string,
  name: string
): AppState {
  return {
    ...state,
    rooms: state.rooms.map((r) =>
      r.id === roomId ? { ...r, name } : r
    ),
  };
}

/**
 * Update a room's wall thickness overrides.
 */
export function updateRoomWallThickness(
  state: AppState,
  roomId: string,
  wallThickness: WallThickness | undefined
): AppState {
  return {
    ...state,
    rooms: state.rooms.map((r) =>
      r.id === roomId ? { ...r, wallThickness } : r
    ),
  };
}

/**
 * Update the global default wall thickness.
 */
export function updateGlobalWallThickness(
  state: AppState,
  thickness: number
): AppState {
  return {
    ...state,
    globalWallThicknessCm: thickness,
  };
}

/**
 * Select a room.
 */
export function selectRoom(state: AppState, roomId: string | null): AppState {
  return {
    ...state,
    selectedRoomId: roomId,
  };
}

/**
 * Update pan/zoom.
 */
export function updateViewport(
  state: AppState,
  panX: number,
  panY: number,
  zoom: number
): AppState {
  return {
    ...state,
    panX,
    panY,
    zoom,
  };
}

/**
 * Get a room by ID.
 */
export function getRoomById(state: AppState, roomId: string): Room | undefined {
  return state.rooms.find((r) => r.id === roomId);
}

/**
 * Replace entire state (for loading from storage).
 */
export function loadState(state: AppState): AppState {
  return state;
}
