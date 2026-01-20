'use client';

import { useState } from 'react';
import { Room, WallSide, WallOpening } from '@/src/model/types';

interface DoorOpeningsPanelProps {
  room: Room;
  openings: WallOpening[];
  onAddDoor: (roomId: string, wall: WallSide, positionCm: number, widthCm: number) => void;
  onUpdateDoor: (openingId: string, updates: Partial<WallOpening>) => void;
  onDeleteDoor: (openingId: string) => void;
}

const wallLabels: Record<WallSide, string> = {
  north: 'North (Top)',
  south: 'South (Bottom)',
  east: 'East (Right)',
  west: 'West (Left)',
};

export function DoorOpeningsPanel({ room, openings, onAddDoor, onUpdateDoor, onDeleteDoor }: DoorOpeningsPanelProps) {
  const [selectedWall, setSelectedWall] = useState<WallSide>('north');
  const [positionCm, setPositionCm] = useState('50');
  const [widthCm, setWidthCm] = useState('90');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState('');
  const [editWidth, setEditWidth] = useState('');

  // Get wall length for validation
  const getWallLengthCm = (wall: WallSide): number => {
    const isHorizontal = wall === 'north' || wall === 'south';
    return isHorizontal ? room.widthCm : room.heightCm;
  };

  const handleAddDoor = () => {
    const pos = parseFloat(positionCm);
    const width = parseFloat(widthCm);
    const wallLength = getWallLengthCm(selectedWall);

    if (isNaN(pos) || isNaN(width) || pos < 0 || width < 10) {
      alert('Please enter valid position and width values');
      return;
    }

    if (pos + width > wallLength) {
      alert(`Door extends beyond wall. Wall length is ${wallLength}cm`);
      return;
    }

    onAddDoor(room.id, selectedWall, pos, width);
    setPositionCm('50');
    setWidthCm('90');
  };

  const handleStartEdit = (opening: WallOpening) => {
    setEditingId(opening.id);
    setEditPosition(opening.positionCm.toString());
    setEditWidth(opening.widthCm.toString());
  };

  const handleSaveEdit = (opening: WallOpening) => {
    const pos = parseFloat(editPosition);
    const width = parseFloat(editWidth);
    const wallLength = getWallLengthCm(opening.wall);

    if (isNaN(pos) || isNaN(width) || pos < 0 || width < 10) {
      alert('Please enter valid position and width values');
      return;
    }

    if (pos + width > wallLength) {
      alert(`Door extends beyond wall. Wall length is ${wallLength}cm`);
      return;
    }

    onUpdateDoor(opening.id, { positionCm: pos, widthCm: width });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Door Openings</h3>

      {/* Add New Door */}
      <div className="bg-slate-50 rounded-lg p-3 space-y-3 mb-4">
        <p className="text-xs font-medium text-slate-500">Add New Door</p>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Wall</label>
          <select
            value={selectedWall}
            onChange={(e) => setSelectedWall(e.target.value as WallSide)}
            className="input-field"
          >
            {(['north', 'south', 'east', 'west'] as WallSide[]).map((wall) => (
              <option key={wall} value={wall}>
                {wallLabels[wall]} - {getWallLengthCm(wall)}cm
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Position (cm)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={positionCm}
              onChange={(e) => setPositionCm(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Width (cm)</label>
            <input
              type="number"
              min="10"
              step="1"
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <button
          onClick={handleAddDoor}
          className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Add Door
        </button>

        <p className="text-xs text-slate-400">
          Tip: Use the Measure tool (M) to find the exact position.
        </p>
      </div>

      {/* Existing Doors List */}
      {openings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Existing Doors ({openings.length})</p>

          {openings.map((opening) => (
            <div
              key={opening.id}
              className="bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
            >
              {editingId === opening.id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 w-16">{wallLabels[opening.wall].split(' ')[0]}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400">Position</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                        className="input-field text-xs py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400">Width</label>
                      <input
                        type="number"
                        min="10"
                        step="1"
                        value={editWidth}
                        onChange={(e) => setEditWidth(e.target.value)}
                        className="input-field text-xs py-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSaveEdit(opening)}
                      className="flex-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-700">{wallLabels[opening.wall].split(' ')[0]}</span>
                    <span className="text-slate-500 ml-2">
                      {opening.positionCm}cm → {opening.positionCm + opening.widthCm}cm
                    </span>
                    <span className="text-slate-400 text-xs ml-1">({opening.widthCm}cm)</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStartEdit(opening)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-all"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteDoor(opening.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {openings.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">
          No doors added yet
        </p>
      )}
    </div>
  );
}
