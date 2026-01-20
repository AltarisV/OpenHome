'use client';

import { useEffect } from 'react';
import { AppState, ToolMode, MeasurePoint } from '@/src/model/types';
import * as State from '@/src/model/state';
import { NUDGE_AMOUNT, NUDGE_AMOUNT_SHIFT } from '../components/constants/editor';

interface UseKeyboardShortcutsProps {
  appState: AppState;
  toolMode: ToolMode;
  updateState: (newState: AppState, recordInHistory?: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  setToolMode: (mode: ToolMode) => void;
  setMeasurePoints: (points: MeasurePoint[]) => void;
}

export function useKeyboardShortcuts({
  appState,
  toolMode,
  updateState,
  onUndo,
  onRedo,
  setToolMode,
  setMeasurePoints,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Select All: Ctrl+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        updateState(State.selectAllRooms(appState), false);
        return;
      }

      // Delete selected rooms or object: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected object first (if any)
        if (appState.selectedObjectId) {
          e.preventDefault();
          updateState(State.deleteSelectedObject(appState));
          return;
        }
        // Otherwise delete selected rooms
        if (appState.selectedRoomIds.length > 0) {
          e.preventDefault();
          updateState(State.deleteRooms(appState, appState.selectedRoomIds));
        }
        return;
      }

      // Arrow keys: nudge selected rooms
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (arrowKeys.includes(e.key) && appState.selectedRoomIds.length > 0) {
        e.preventDefault();
        const amount = e.shiftKey ? NUDGE_AMOUNT_SHIFT : NUDGE_AMOUNT;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -amount;
        if (e.key === 'ArrowDown') dy = amount;
        if (e.key === 'ArrowLeft') dx = -amount;
        if (e.key === 'ArrowRight') dx = amount;
        updateState(State.nudgeSelectedRooms(appState, dx, dy));
        return;
      }

      // M key: toggle measure tool
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setToolMode(toolMode === 'measure' ? 'select' : 'measure');
        setMeasurePoints([]);
        return;
      }

      // Escape: clear selection/tool mode
      if (e.key === 'Escape') {
        if (toolMode !== 'select') {
          setToolMode('select');
          setMeasurePoints([]);
        } else {
          updateState(State.clearSelection(appState), false);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, onUndo, onRedo, updateState, toolMode, setToolMode, setMeasurePoints]);
}
