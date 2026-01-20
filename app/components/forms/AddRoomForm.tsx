'use client';

import { useState } from 'react';

interface AddRoomFormProps {
  onAddRoom: (name: string, widthCm: number, heightCm: number) => void;
}

export function AddRoomForm({ onAddRoom }: AddRoomFormProps) {
  const [name, setName] = useState('');
  const [widthCm, setWidthCm] = useState(300);
  const [heightCm, setHeightCm] = useState(400);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && widthCm > 0 && heightCm > 0) {
      onAddRoom(name, widthCm, heightCm);
      setName('');
      setWidthCm(300);
      setHeightCm(400);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Living Room"
          className="input-field"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Width (cm)</label>
          <input
            type="number"
            min="1"
            value={widthCm}
            onChange={(e) => setWidthCm(Number(e.target.value))}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Height (cm)</label>
          <input
            type="number"
            min="1"
            value={heightCm}
            onChange={(e) => setHeightCm(Number(e.target.value))}
            className="input-field"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full btn btn-primary"
      >
        Add Room
      </button>
    </form>
  );
}
