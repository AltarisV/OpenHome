'use client';

import { useState, useEffect } from 'react';
import { Room } from '@/src/model/types';

interface RoomPropertiesPanelProps {
  room: Room;
  globalWallThickness: number;
  onUpdateName: (roomId: string, name: string) => void;
  onUpdateDimensions: (roomId: string, widthCm: number, heightCm: number) => void;
  onUpdateWallThickness: (roomId: string, wallThickness: {
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  }) => void;
  onDelete: (roomId: string) => void;
}

export function RoomPropertiesPanel({
  room,
  globalWallThickness,
  onUpdateName,
  onUpdateDimensions,
  onUpdateWallThickness,
  onDelete,
}: RoomPropertiesPanelProps) {
  const [name, setName] = useState(room.name);
  const [widthCm, setWidthCm] = useState(room.widthCm);
  const [heightCm, setHeightCm] = useState(room.heightCm);
  const [wallNorth, setWallNorth] = useState<string>(room.wallThickness?.north?.toString() ?? '');
  const [wallSouth, setWallSouth] = useState<string>(room.wallThickness?.south?.toString() ?? '');
  const [wallEast, setWallEast] = useState<string>(room.wallThickness?.east?.toString() ?? '');
  const [wallWest, setWallWest] = useState<string>(room.wallThickness?.west?.toString() ?? '');

  // Keep panel inputs in sync when selecting another room
  useEffect(() => {
    setName(room.name);
    setWidthCm(room.widthCm);
    setHeightCm(room.heightCm);
    setWallNorth(room.wallThickness?.north?.toString() ?? '');
    setWallSouth(room.wallThickness?.south?.toString() ?? '');
    setWallEast(room.wallThickness?.east?.toString() ?? '');
    setWallWest(room.wallThickness?.west?.toString() ?? '');
  }, [room.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNameChange = () => {
    if (name !== room.name) {
      onUpdateName(room.id, name);
    }
  };

  const handleDimensionsChange = () => {
    if (widthCm !== room.widthCm || heightCm !== room.heightCm) {
      onUpdateDimensions(room.id, widthCm, heightCm);
    }
  };

  const handleWallThicknessChange = () => {
    const walls = {
      north: wallNorth ? Number(wallNorth) : undefined,
      south: wallSouth ? Number(wallSouth) : undefined,
      east: wallEast ? Number(wallEast) : undefined,
      west: wallWest ? Number(wallWest) : undefined,
    };
    onUpdateWallThickness(room.id, walls);
  };

  return (
    <div>
      {/* Room header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameChange}
            className="font-semibold text-slate-800 bg-transparent border-none outline-none w-full focus:ring-0 p-0"
          />
          <p className="text-xs text-slate-400">{room.widthCm} × {room.heightCm} cm</p>
        </div>
      </div>

      {/* Dimensions */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-600 mb-2">Dimensions</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Width (cm)</label>
            <input
              type="number"
              min="1"
              step="10"
              value={widthCm}
              onChange={(e) => setWidthCm(Number(e.target.value))}
              onBlur={handleDimensionsChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Height (cm)</label>
            <input
              type="number"
              min="1"
              step="10"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              onBlur={handleDimensionsChange}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Wall Thickness */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-600">Wall Thickness</label>
          <span className="text-xs text-slate-400">Default: {globalWallThickness}cm</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">North</label>
            <input
              type="number"
              min="0"
              step="1"
              value={wallNorth}
              onChange={(e) => setWallNorth(e.target.value)}
              onBlur={handleWallThicknessChange}
              placeholder="—"
              className="input-field text-center"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">South</label>
            <input
              type="number"
              min="0"
              step="1"
              value={wallSouth}
              onChange={(e) => setWallSouth(e.target.value)}
              onBlur={handleWallThicknessChange}
              placeholder="—"
              className="input-field text-center"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">East</label>
            <input
              type="number"
              min="0"
              step="1"
              value={wallEast}
              onChange={(e) => setWallEast(e.target.value)}
              onBlur={handleWallThicknessChange}
              placeholder="—"
              className="input-field text-center"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">West</label>
            <input
              type="number"
              min="0"
              step="1"
              value={wallWest}
              onChange={(e) => setWallWest(e.target.value)}
              onBlur={handleWallThicknessChange}
              placeholder="—"
              className="input-field text-center"
            />
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={() => {
          if (confirm('Delete this room?')) {
            onDelete(room.id);
          }
        }}
        className="w-full btn btn-danger"
      >
        Delete Room
      </button>
    </div>
  );
}
