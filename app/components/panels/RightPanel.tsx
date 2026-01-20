'use client';

import React from 'react';
import { AppState, Room, PlacedObject, ObjectDef, WallOpening } from '../../../src/model/types';
import * as State from '../../../src/model/state';
import { RoomPropertiesPanel, DoorOpeningsPanel } from '../panels';

interface RightPanelProps {
  appState: AppState;
  selectedRoom: Room | undefined;
  onUpdateRoomName: (roomId: string, name: string) => void;
  onUpdateRoomDimensions: (roomId: string, width: number, height: number) => void;
  onUpdateRoomWallThickness: (roomId: string, wallThickness: { north?: number; south?: number; east?: number; west?: number }) => void;
  onDeleteRoom: (roomId: string) => void;
  onDeleteSelected: () => void;
  onAddDoor: (roomId: string, wall: 'north' | 'south' | 'east' | 'west', position: number, width: number) => void;
  onUpdateDoor: (openingId: string, updates: Partial<WallOpening>) => void;
  onDeleteDoor: (openingId: string) => void;
  onUpdatePlacedObjectPosition: (objectId: string, x: number, y: number) => void;
  onUpdatePlacedObjectRotation: (objectId: string, rotation: number) => void;
  onUpdatePlacedObjectRoom: (objectId: string, roomId: string) => void;
  onUpdatePlacedObjectSize: (objectId: string, widthCm: number, heightCm: number) => void;
}

export default function RightPanel({
  appState,
  selectedRoom,
  onUpdateRoomName,
  onUpdateRoomDimensions,
  onUpdateRoomWallThickness,
  onDeleteRoom,
  onDeleteSelected,
  onAddDoor,
  onUpdateDoor,
  onDeleteDoor,
  onUpdatePlacedObjectPosition,
  onUpdatePlacedObjectRotation,
  onUpdatePlacedObjectRoom,
  onUpdatePlacedObjectSize,
}: RightPanelProps) {
  return (
    <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto shadow-sm flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Properties</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5">
      {appState.selectedRoomIds.length > 1 ? (
        // Multi-select panel
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold">{appState.selectedRoomIds.length}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Rooms Selected</h3>
              <p className="text-xs text-slate-400">Arrow keys to nudge</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-6">
            {appState.selectedRoomIds.map((id) => {
              const r = State.getRoomById(appState, id);
              return r ? (
                <div key={id} className="px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 font-medium">
                  {r.name}
                </div>
              ) : null;
            })}
          </div>
          <button
            onClick={() => {
              if (confirm(`Delete ${appState.selectedRoomIds.length} rooms?`)) {
                onDeleteSelected();
              }
            }}
            className="w-full btn btn-danger"
          >
            Delete All Selected
          </button>
        </div>
      ) : appState.selectedObjectId ? (
        // Selected object panel
        <SelectedObjectPanel
          appState={appState}
          onDeleteSelected={onDeleteSelected}
          onUpdatePosition={onUpdatePlacedObjectPosition}
          onUpdateRotation={onUpdatePlacedObjectRotation}
          onUpdateRoom={onUpdatePlacedObjectRoom}
          onUpdateSize={onUpdatePlacedObjectSize}
        />
      ) : selectedRoom ? (
        <>
          <RoomPropertiesPanel
            room={selectedRoom}
            globalWallThickness={appState.globalWallThicknessCm}
            onUpdateName={onUpdateRoomName}
            onUpdateDimensions={onUpdateRoomDimensions}
            onUpdateWallThickness={onUpdateRoomWallThickness}
            onDelete={onDeleteRoom}
          />
          
          {/* Door Openings Section */}
          <DoorOpeningsPanel
            room={selectedRoom}
            openings={State.getOpeningsForRoom(appState, selectedRoom.id)}
            onAddDoor={onAddDoor}
            onUpdateDoor={onUpdateDoor}
            onDeleteDoor={onDeleteDoor}
          />
        </>
      ) : (
        <NoSelectionPanel />
      )}
      </div>
    </div>
  );
}

// Sub-component for selected object
function SelectedObjectPanel({
  appState,
  onDeleteSelected,
  onUpdatePosition,
  onUpdateRotation,
  onUpdateRoom,
  onUpdateSize,
}: {
  appState: AppState;
  onDeleteSelected: () => void;
  onUpdatePosition: (objectId: string, x: number, y: number) => void;
  onUpdateRotation: (objectId: string, rotation: number) => void;
  onUpdateRoom: (objectId: string, roomId: string) => void;
  onUpdateSize: (objectId: string, widthCm: number, heightCm: number) => void;
}) {
  const selectedObject = (appState.placedObjects ?? []).find(p => p.id === appState.selectedObjectId);
  const objectDef = selectedObject ? appState.objectDefs?.find(d => d.id === selectedObject.defId) : null;
  const containingRoom = selectedObject ? appState.rooms.find(r => r.id === selectedObject.roomId) : null;
  
  if (!selectedObject || !objectDef) return null;
  
  // Get effective size (override or default from ObjectDef)
  const effectiveWidth = selectedObject.widthCm ?? objectDef.widthCm;
  const effectiveHeight = selectedObject.heightCm ?? objectDef.heightCm;
  
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{objectDef.name}</h3>
          <p className="text-xs text-slate-400">{effectiveWidth} × {effectiveHeight} cm</p>
        </div>
      </div>
      
      <div className="space-y-4">
        
        {/* Editable Size */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Breite (cm)</label>
            <input
              type="number"
              value={effectiveWidth}
              min={1}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  onUpdateSize(selectedObject.id, val, effectiveHeight);
                }
              }}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Höhe (cm)</label>
            <input
              type="number"
              value={effectiveHeight}
              min={1}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  onUpdateSize(selectedObject.id, effectiveWidth, val);
                }
              }}
              className="input-field"
            />
          </div>
        </div>
        
        {/* Editable Position */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">X Position (cm)</label>
            <input
              type="number"
              value={Math.round(selectedObject.xCm)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  onUpdatePosition(selectedObject.id, val, selectedObject.yCm);
                }
              }}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Y (cm)</label>
            <input
              type="number"
              value={Math.round(selectedObject.yCm)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  onUpdatePosition(selectedObject.id, selectedObject.xCm, val);
                }
              }}
              className="input-field"
            />
          </div>
        </div>
        
        {/* Editable Rotation */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Rotation</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={selectedObject.rotationDeg ?? 0}
              step={90}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  onUpdateRotation(selectedObject.id, val % 360);
                }
              }}
              className="input-field flex-1"
            />
            <span className="text-slate-400">°</span>
            <button
              onClick={() => {
                const current = selectedObject.rotationDeg ?? 0;
                onUpdateRotation(selectedObject.id, (current + 90) % 360);
              }}
              className="btn btn-secondary"
              title="Rotate 90°"
            >
              ↻ 90°
            </button>
          </div>
        </div>
        
        {/* Room Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Raum</label>
          <select
            value={selectedObject.roomId}
            onChange={(e) => onUpdateRoom(selectedObject.id, e.target.value)}
            className="input-field w-full"
          >
            {appState.rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">Wird automatisch beim Verschieben erkannt</p>
        </div>
      </div>
        
      <button
        onClick={() => {
          if (confirm(`Delete ${objectDef.name}?`)) {
            onDeleteSelected();
          }
        }}
        className="w-full btn btn-danger mt-6"
      >
          Delete Object
      </button>
    </div>
  );
}

// Sub-component for no selection state
function NoSelectionPanel() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
      </div>
      <p className="text-slate-500 font-medium">No Selection</p>
      <p className="text-xs text-slate-400 mt-1">Select a room or object to edit</p>
    </div>
  );
}
