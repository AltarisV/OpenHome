'use client';

import React from 'react';
import { AppState, ToolMode } from '../../../src/model/types';
import * as State from '../../../src/model/state';

interface EditorToolbarFullProps {
  appState: AppState;
  toolMode: ToolMode;
  measureDistance: number | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onSelectTool: () => void;
  onMeasureTool: () => void;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
}

export default function EditorToolbarFull({
  appState,
  toolMode,
  measureDistance,
  onZoomIn,
  onZoomOut,
  onResetView,
  onSelectTool,
  onMeasureTool,
  onToggleLeftPanel,
  onToggleRightPanel,
}: EditorToolbarFullProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-2 sm:px-4 py-2 sm:py-2.5 flex items-center gap-1.5 sm:gap-3">
      {/* Mobile menu button - left panel */}
      {onToggleLeftPanel && (
        <button
          onClick={onToggleLeftPanel}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          title="Menu"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 rounded-lg p-0.5 sm:p-1">
        <button
          onClick={onZoomOut}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-600 font-medium transition-all"
        >
          −
        </button>
        <span className="text-xs sm:text-sm font-medium text-slate-600 w-10 sm:w-14 text-center">
          {Math.round(appState.zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-slate-600 font-medium transition-all"
        >
          +
        </button>
      </div>
      
      <button
        onClick={onResetView}
        className="hidden sm:block px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
      >
        Reset View
      </button>

      <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>

      {/* Tool mode buttons */}
      <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 rounded-lg p-0.5 sm:p-1">
        <button
          onClick={onSelectTool}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 transition-all duration-150 cursor-pointer ${
            toolMode === 'select' 
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800 active:bg-slate-300'
          }`}
          title="Select tool (Esc)"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
          <span className="hidden sm:inline">Select</span>
        </button>
        <button
          onClick={onMeasureTool}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 transition-all duration-150 cursor-pointer ${
            toolMode === 'measure' 
              ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800 active:bg-slate-300'
          }`}
          title="Measure tool (M)"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M2 12l4-4m-4 4l4 4m16-4l-4-4m4 4l-4 4"/></svg>
          <span className="hidden sm:inline">Measure</span>
        </button>
      </div>

      {/* Show measurement result */}
      {measureDistance !== null && (
        <div className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs sm:text-sm font-medium text-amber-700 flex items-center gap-1 sm:gap-2">
          <svg className="w-4 h-4 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M2 12l4-4m-4 4l4 4m16-4l-4-4m4 4l-4 4"/></svg>
          {measureDistance.toFixed(1)}cm
        </div>
      )}

      {appState.selectedRoomIds.length > 1 && (
        <span className="badge badge-blue ml-1 sm:ml-2 text-xs">{appState.selectedRoomIds.length} rooms</span>
      )}

      <div className="ml-auto hidden md:flex items-center gap-4 text-xs text-slate-400">
        <span>Scroll to zoom</span>
        <span className="text-slate-300">•</span>
        <span>M for measure</span>
      </div>

      {/* Mobile menu button - right panel (properties) */}
      {onToggleRightPanel && (
        <button
          onClick={onToggleRightPanel}
          className="lg:hidden ml-auto w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          title="Properties"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
        </button>
      )}
    </div>
  );
}
