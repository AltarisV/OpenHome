'use client';

import { ToolMode, MeasurePoint, AppState } from '@/src/model/types';
import * as State from '@/src/model/state';

interface EditorToolbarProps {
  appState: AppState;
  toolMode: ToolMode;
  measureDistance: number | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onSetToolMode: (mode: ToolMode) => void;
  onClearMeasurePoints: () => void;
}

export function EditorToolbar({
  appState,
  toolMode,
  measureDistance,
  onZoomIn,
  onZoomOut,
  onResetView,
  onSetToolMode,
  onClearMeasurePoints,
}: EditorToolbarProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        <button
          onClick={onZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-600 font-medium transition-all"
        >
          −
        </button>
        <span className="text-sm font-medium text-slate-600 w-14 text-center">
          {Math.round(appState.zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-600 font-medium transition-all"
        >
          +
        </button>
      </div>
      
      <button
        onClick={onResetView}
        className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
      >
        Reset View
      </button>

      <div className="w-px h-6 bg-slate-200 mx-1"></div>

      {/* Tool mode buttons */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => { onSetToolMode('select'); onClearMeasurePoints(); }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
            toolMode === 'select' 
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800 active:bg-slate-300'
          }`}
          title="Select tool (Esc)"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          </svg>
          Select
        </button>
        <button
          onClick={() => { onSetToolMode('measure'); onClearMeasurePoints(); }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
            toolMode === 'measure' 
              ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800 active:bg-slate-300'
          }`}
          title="Measure tool (M)"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12h20M2 12l4-4m-4 4l4 4m16-4l-4-4m4 4l-4 4"/>
          </svg>
          Measure
        </button>
      </div>

      {/* Show measurement result */}
      {measureDistance !== null && (
        <div className="ml-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium text-amber-700 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12h20M2 12l4-4m-4 4l4 4m16-4l-4-4m4 4l-4 4"/>
          </svg>
          {measureDistance.toFixed(1)} cm <span className="text-amber-500">({(measureDistance / 100).toFixed(2)} m)</span>
        </div>
      )}

      {appState.selectedRoomIds.length > 1 && (
        <span className="badge badge-blue ml-2">{appState.selectedRoomIds.length} rooms selected</span>
      )}

      <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
        <span>Scroll to zoom</span>
        <span className="text-slate-300">•</span>
        <span>M for measure</span>
      </div>
    </div>
  );
}
