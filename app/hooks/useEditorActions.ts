'use client';

import { useCallback } from 'react';
import { AppState, HistoryState, WallSide, WallOpening } from '@/src/model/types';
import * as State from '@/src/model/state';
import { DEFAULT_DOOR_WIDTH } from '../components/constants/editor';

interface UseEditorActionsProps {
  appState: AppState;
  updateState: (newState: AppState, recordInHistory?: boolean) => void;
}

export function useEditorActions({ appState, updateState }: UseEditorActionsProps) {
  // Handle add room form submission
  const handleAddRoom = useCallback((name: string, widthCm: number, heightCm: number) => {
    const newState = State.addRoom(appState, name, widthCm, heightCm);
    updateState(newState);
  }, [appState, updateState]);

  // Handle delete room
  const handleDeleteRoom = useCallback((roomId: string) => {
    const newState = State.deleteRoom(appState, roomId);
    updateState(newState);
  }, [appState, updateState]);

  // Handle delete selected rooms or object
  const handleDeleteSelected = useCallback(() => {
    if (appState.selectedObjectId) {
      updateState(State.deleteSelectedObject(appState));
    } else if (appState.selectedRoomIds.length > 0) {
      updateState(State.deleteRooms(appState, appState.selectedRoomIds));
    }
  }, [appState, updateState]);

  // Handle select room (with optional multi-select)
  const handleSelectRoom = useCallback((roomId: string | null, addToSelection = false) => {
    if (roomId === null) {
      updateState(State.clearSelection(appState), false);
    } else if (addToSelection) {
      updateState(State.toggleRoomSelection(appState, roomId), false);
    } else {
      updateState(State.selectRoom(appState, roomId), false);
    }
  }, [appState, updateState]);

  // Handle update room name
  const handleUpdateRoomName = useCallback((roomId: string, name: string) => {
    const newState = State.updateRoomName(appState, roomId, name);
    updateState(newState);
  }, [appState, updateState]);

  // Handle update room dimensions
  const handleUpdateRoomDimensions = useCallback((roomId: string, widthCm: number, heightCm: number) => {
    const newState = State.updateRoomDimensions(appState, roomId, widthCm, heightCm);
    updateState(newState);
  }, [appState, updateState]);

  // Handle update global wall thickness
  const handleUpdateGlobalWallThickness = useCallback((thickness: number) => {
    const newState = State.updateGlobalWallThickness(appState, thickness);
    updateState(newState);
  }, [appState, updateState]);

  // Handle update room wall thickness
  const handleUpdateRoomWallThickness = useCallback((roomId: string, wallThickness: {
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  }) => {
    const newState = State.updateRoomWallThickness(appState, roomId, wallThickness);
    updateState(newState);
  }, [appState, updateState]);

  // Objects: add definition, place, duplicate
  const handleAddObjectDef = useCallback((name: string, widthCm: number, heightCm: number) => {
    const newState = State.addObjectDef(appState, name, widthCm, heightCm);
    updateState(newState);
  }, [appState, updateState]);

  const handlePlaceObjectDef = useCallback((defId: string) => {
    const def = appState.objectDefs?.find((d) => d.id === defId);
    const selectedRoomId = appState.selectedRoomIds[0];
    const room = selectedRoomId ? State.getRoomById(appState, selectedRoomId) : undefined;
    if (!def || !room) return;

    // place at room center
    const xCm = room.xCm + (room.widthCm - def.widthCm) / 2;
    const yCm = room.yCm + (room.heightCm - def.heightCm) / 2;

    const newState = State.placeObject(appState, defId, room.id, xCm, yCm);
    updateState(newState);
  }, [appState, updateState]);

  const handleDuplicatePlaced = useCallback((placedId: string) => {
    const newState = State.duplicatePlacedObject(appState, placedId);
    updateState(newState);
  }, [appState, updateState]);

  // Door/opening handlers
  const handleAddDoor = useCallback((roomId: string, wall: WallSide, positionCm: number, widthCm: number = DEFAULT_DOOR_WIDTH) => {
    const newState = State.addWallOpening(appState, roomId, wall, 'door', positionCm, widthCm);
    updateState(newState);
  }, [appState, updateState]);

  const handleUpdateDoor = useCallback((openingId: string, updates: Partial<WallOpening>) => {
    const newState = State.updateWallOpening(appState, openingId, updates.positionCm, updates.widthCm);
    updateState(newState);
  }, [appState, updateState]);

  const handleDeleteDoor = useCallback((openingId: string) => {
    const newState = State.deleteWallOpening(appState, openingId);
    updateState(newState);
  }, [appState, updateState]);

  // Select object
  const handleSelectObject = useCallback((objectId: string | null) => {
    updateState(State.selectObject(appState, objectId), false);
  }, [appState, updateState]);

  // Update object position
  const handleUpdateObjectPosition = useCallback((objectId: string, xCm: number, yCm: number) => {
    const newState = State.updatePlacedObjectPosition(appState, objectId, xCm, yCm);
    updateState(newState);
  }, [appState, updateState]);

  // Update object rotation
  const handleUpdateObjectRotation = useCallback((objectId: string, rotation: number) => {
    const newState = State.updatePlacedObjectRotation(appState, objectId, rotation);
    updateState(newState);
  }, [appState, updateState]);

  return {
    handleAddRoom,
    handleDeleteRoom,
    handleDeleteSelected,
    handleSelectRoom,
    handleUpdateRoomName,
    handleUpdateRoomDimensions,
    handleUpdateGlobalWallThickness,
    handleUpdateRoomWallThickness,
    handleAddObjectDef,
    handlePlaceObjectDef,
    handleDuplicatePlaced,
    handleAddDoor,
    handleUpdateDoor,
    handleDeleteDoor,
    handleSelectObject,
    handleUpdateObjectPosition,
    handleUpdateObjectRotation,
  };
}
