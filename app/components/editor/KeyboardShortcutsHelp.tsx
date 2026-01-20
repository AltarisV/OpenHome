'use client';

import React from 'react';

export default function KeyboardShortcutsHelp() {
  return (
    <div className="fixed bottom-4 right-4 bg-slate-800/90 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-xl shadow-lg">
      <div className="font-semibold mb-1.5 text-slate-300">Shortcuts</div>
      <div className="space-y-0.5 text-slate-400">
        <div><span className="text-white">Ctrl+Z</span> Undo • <span className="text-white">Ctrl+Y</span> Redo</div>
        <div><span className="text-white">Del</span> Delete • <span className="text-white">M</span> Measure</div>
        <div><span className="text-white">Ctrl+A</span> Select All • <span className="text-white">Esc</span> Deselect</div>
      </div>
    </div>
  );
}
