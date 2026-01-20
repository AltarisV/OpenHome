'use client';

import { useState } from 'react';

interface ObjectDefFormProps {
  onAdd: (name: string, widthCm: number, heightCm: number) => void;
}

export function ObjectDefForm({ onAdd }: ObjectDefFormProps) {
  const [name, setName] = useState('New Object');
  const [widthCm, setWidthCm] = useState(50);
  const [heightCm, setHeightCm] = useState(50);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), widthCm, heightCm);
    setName('New Object');
    setWidthCm(50);
    setHeightCm(50);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Object name"
        className="input-field" 
      />
      <div className="flex gap-2">
        <input 
          type="number" 
          min={1} 
          value={widthCm} 
          onChange={(e)=>setWidthCm(Number(e.target.value))} 
          className="input-field" 
          placeholder="W"
        />
        <input 
          type="number" 
          min={1} 
          value={heightCm} 
          onChange={(e)=>setHeightCm(Number(e.target.value))} 
          className="input-field" 
          placeholder="H"
        />
      </div>
      <button type="submit" className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white">
        Add Object
      </button>
    </form>
  );
}
