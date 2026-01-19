'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, DragState, Room } from '@/src/model/types';
import * as State from '@/src/model/state';
import * as Interaction from '@/src/editor/Interaction';
import * as Snap from '@/src/editor/Snap';
import * as Renderer from '@/src/editor/Renderer';
import {
  saveState,
  loadState,
  exportStateAsJson,
  importStateFromJson,
} from '@/src/storage/localStorage';

const SCALE = 5; // 1cm = 5px

/**
 * Main room editor component with three-panel layout:
 * - Left: Add room form + global settings
 * - Center: SVG editor with pan, zoom, drag
 * - Right: Selected room properties
 */
export default function RoomEditor() {
  const [appState, setAppState] = useState<AppState>(State.createInitialState());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [currentSnapResult, setCurrentSnapResult] = useState<Snap.SnapResult | null>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 1000, height: 1000 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate label positions in screen pixels accounting for SVG viewBox mapping
  const { roomLabelPositions, placedLabelPositions } = useMemo(() => {
    const vbSize = 10000; // viewBox 0..10000
    const svgEl = svgRef.current;
    if (!svgEl) return { roomLabelPositions: [], placedLabelPositions: [] } as any;

    const rect = svgEl.getBoundingClientRect();
    const scaleToScreen = Math.min(rect.width / vbSize, rect.height / vbSize);
    const offsetX = (rect.width - vbSize * scaleToScreen) / 2;
    const offsetY = (rect.height - vbSize * scaleToScreen) / 2;

    const rooms = appState.rooms.map((room) => {
      const contentX = room.xCm * SCALE + (room.widthCm * SCALE) / 2; // center X in content-space
      const contentY = room.yCm * SCALE; // top Y in content-space

      // apply <g transform="translate(panX panY) scale(zoom)">
      const transformedX = appState.panX + appState.zoom * contentX;
      const transformedY = appState.panY + appState.zoom * contentY;

      const screenX = offsetX + transformedX * scaleToScreen;
      const screenY = offsetY + transformedY * scaleToScreen;

      return { roomId: room.id, x: screenX, y: screenY, isSelected: room.id === appState.selectedRoomId };
    });

    const placed = (appState.placedObjects ?? []).map((p) => {
      const def = appState.objectDefs?.find((d) => d.id === p.defId);
      if (!def) return null;
      const contentX = p.xCm * SCALE + (def.widthCm * SCALE) / 2;
      const contentY = p.yCm * SCALE + (def.heightCm * SCALE) / 2;
      const transformedX = appState.panX + appState.zoom * contentX;
      const transformedY = appState.panY + appState.zoom * contentY;
      const screenX = offsetX + transformedX * scaleToScreen;
      const screenY = offsetY + transformedY * scaleToScreen;
      return { placedId: p.id, x: screenX, y: screenY };
    }).filter(Boolean) as Array<{ placedId: string; x: number; y: number }>;

    return { roomLabelPositions: rooms, placedLabelPositions: placed };
  }, [appState.rooms, appState.placedObjects, appState.objectDefs, appState.panX, appState.panY, appState.zoom, svgDimensions]);

  // Load state from localStorage on mount
  useEffect(() => {
    const loaded = loadState();
    setAppState(loaded);
  }, []);

  // Measure SVG dimensions
  useEffect(() => {
    const measureSvg = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgDimensions({ width: rect.width, height: rect.height });
      }
    };

    measureSvg();
    window.addEventListener('resize', measureSvg);
    return () => window.removeEventListener('resize', measureSvg);
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  // Handle add room form submission
  const handleAddRoom = (name: string, widthCm: number, heightCm: number) => {
    const newState = State.addRoom(appState, name, widthCm, heightCm);
    setAppState(newState);
  };

  // Handle delete room
  const handleDeleteRoom = (roomId: string) => {
    const newState = State.deleteRoom(appState, roomId);
    setAppState(newState);
  };

  // Handle select room
  const handleSelectRoom = (roomId: string | null) => {
    const newState = State.selectRoom(appState, roomId);
    setAppState(newState);
  };

  // Handle update room name
  const handleUpdateRoomName = (roomId: string, name: string) => {
    const newState = State.updateRoomName(appState, roomId, name);
    setAppState(newState);
  };

  // Handle update room dimensions
  const handleUpdateRoomDimensions = (roomId: string, widthCm: number, heightCm: number) => {
    const newState = State.updateRoomDimensions(appState, roomId, widthCm, heightCm);
    setAppState(newState);
  };

  // Handle update global wall thickness
  const handleUpdateGlobalWallThickness = (thickness: number) => {
    const newState = State.updateGlobalWallThickness(appState, thickness);
    setAppState(newState);
  };

  // Handle update room wall thickness
  const handleUpdateRoomWallThickness = (roomId: string, wallThickness: any) => {
    const newState = State.updateRoomWallThickness(appState, roomId, wallThickness);
    setAppState(newState);
  };

  // Objects: add definition, place, duplicate
  const handleAddObjectDef = (name: string, widthCm: number, heightCm: number) => {
    const newState = State.addObjectDef(appState, name, widthCm, heightCm);
    setAppState(newState);
  };

  const handlePlaceObjectDef = (defId: string) => {
    const def = appState.objectDefs?.find((d) => d.id === defId);
    const room = appState.selectedRoomId ? State.getRoomById(appState, appState.selectedRoomId) : undefined;
    if (!def || !room) return;

    // place at room center
    const xCm = room.xCm + (room.widthCm - def.widthCm) / 2;
    const yCm = room.yCm + (room.heightCm - def.heightCm) / 2;

    const newState = State.placeObject(appState, defId, room.id, xCm, yCm);
    setAppState(newState);
  };

  const handleDuplicatePlaced = (placedId: string) => {
    const newState = State.duplicatePlacedObject(appState, placedId);
    setAppState(newState);
  };

  /**
   * Pointer handlers:
   * - Use event delegation (data-room-id)
   * - Use pointer capture so dragging keeps working even if cursor leaves SVG
   *
   * IMPORTANT:
   * Your Interaction.getSvgCoordinates() should accept a PointerEvent (or a union)
   * and should return coordinates in the same "content space" as the <g transform="translate(pan) scale(zoom)">.
   */
  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    // Capture pointer so we keep receiving move events
    svgRef.current.setPointerCapture(e.pointerId);

    // Find if pointer is on a placed object first, then a room (event delegation)
    const target = e.target as Element;
    const placedEl = target.closest?.('[data-placed-id]') as Element | null;
    const placedId = placedEl?.getAttribute('data-placed-id');
    const roomEl = target.closest?.('[data-room-id]') as Element | null;
    const roomId = roomEl?.getAttribute('data-room-id');

    // Convert pointer to SVG/content-space, then to cm
    const { x, y } = Interaction.getSvgCoordinates(
      e,
      svgRef.current,
      appState.panX,
      appState.panY,
      appState.zoom
    );
    const { xCm, yCm } = Interaction.svgPixelsToCm(x, y);

    // If clicked on a placed object, start placed-object drag
    if (placedId) {
      const placed = (appState.placedObjects ?? []).find((p) => p.id === placedId);
      if (placed) {
        // Select the room containing the object
        handleSelectRoom(placed.roomId);
        const ds = Interaction.startPlacedDrag(placed, x, y) as any;
        ds.targetType = 'placed';
        setDragState(ds);
        return;
      }
    }

    if (roomId) {
      const room = State.getRoomById(appState, roomId);
      if (!room) return;

      // Start dragging the room
      handleSelectRoom(room.id);
      const ds = Interaction.startDrag(room, x, y) as any;
      ds.targetType = 'room';
      setDragState(ds);
      return;
    }

    // Empty space: start panning
    setDragState({
      roomId: '__pan__',
      startX: e.clientX,
      startY: e.clientY,
      roomStartX: appState.panX,
      roomStartY: appState.panY,
    });
    handleSelectRoom(null);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || !dragState) return;

    // Panning
    if (dragState.roomId === '__pan__') {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      const newPanX = dragState.roomStartX + deltaX;
      const newPanY = dragState.roomStartY + deltaY;

      setAppState((prev) => State.updateViewport(prev, newPanX, newPanY, prev.zoom));
      return;
    }

    // Drag room or placed object
    const { x, y } = Interaction.getSvgCoordinates(
      e,
      svgRef.current,
      appState.panX,
      appState.panY,
      appState.zoom
    );

    const { xCm, yCm } = Interaction.calculateDragPosition(dragState, x, y);

    // If dragging a placed object
    if ((dragState as any).targetType === 'placed') {
      setAppState((prev) => {
        const placed = (prev.placedObjects ?? []).find((p) => p.id === dragState.roomId);
        if (!placed) return prev;
        const def = (prev.objectDefs ?? []).find((d) => d.id === placed.defId);
        const room = prev.rooms.find((r) => r.id === placed.roomId);
        if (!def || !room) return prev;

        const snapRes = Snap.calculatePlacedObjectSnap(def.widthCm, def.heightCm, room, xCm, yCm);
        // show guides and debug info
        setCurrentSnapResult(snapRes);
        try {
          // lightweight debug to help diagnose snapping behavior
          // eslint-disable-next-line no-console
          console.debug('placed-drag', { xCm, yCm, snapRes });
        } catch {}

        return State.updatePlacedObjectPosition(prev, placed.id, snapRes.xCm, snapRes.yCm);
      });
      return;
    }

    // Otherwise dragging a room
    setAppState((prev) => {
      const room = State.getRoomById(prev, dragState.roomId);
      if (!room) return prev;

      const snap = Snap.calculateSnap(room, prev.rooms, xCm, yCm, prev.globalWallThicknessCm);
      setCurrentSnapResult(snap);

      const constrained = Interaction.constrainRoomPosition(snap.xCm, snap.yCm);
      return State.updateRoomPosition(prev, dragState.roomId, constrained.xCm, constrained.yCm);
    });
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (svgRef.current) {
      try {
        svgRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    setDragState(null);
    setCurrentSnapResult(null);
  };

  // Handle SVG wheel (zoom)
  const handleSvgWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const deltaY = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, appState.zoom * deltaY));

    const newState = State.updateViewport(appState, appState.panX, appState.panY, newZoom);
    setAppState(newState);
  };

  // Handle export
  const handleExport = () => {
    exportStateAsJson(appState);
  };

  // Handle import
  const handleImport = async (file: File) => {
    try {
      const imported = await importStateFromJson(file);
      setAppState(imported);
    } catch (error) {
      alert('Failed to import file: ' + (error as Error).message);
    }
  };

  const selectedRoom = appState.selectedRoomId
    ? State.getRoomById(appState, appState.selectedRoomId)
    : undefined;

  const isDraggingRoom = dragState && dragState.roomId !== '__pan__';

  const snap = currentSnapResult;

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel: Add Room Form + Settings */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">OpenHome</h1>

        {/* Add Room Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Room</h2>
          <AddRoomForm onAddRoom={handleAddRoom} />
        </div>

        {/* Global Wall Thickness */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Wall Thickness (cm)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={appState.globalWallThicknessCm}
            onChange={(e) => handleUpdateGlobalWallThickness(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Import/Export */}
        <div className="mb-8 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Data</h2>
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
          >
            Export JSON
          </button>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleImport(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <span className="w-full block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-center cursor-pointer">
              Import JSON
            </span>
          </label>
        </div>

        {/* Rooms List */}
          {/* Objects Library */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Objects</h2>
          <ObjectDefForm onAdd={handleAddObjectDef} />
          <div className="mt-3">
            {(appState.objectDefs ?? []).map((def) => (
              <div key={def.id} className="flex items-center gap-2 mb-2">
                <div className="flex-1 text-sm">{def.name} ({def.widthCm}×{def.heightCm}cm)</div>
                <button
                  onClick={() => handlePlaceObjectDef(def.id)}
                  disabled={!appState.selectedRoomId}
                  title={appState.selectedRoomId ? `Place in selected room` : 'Select a room first'}
                  className={`px-2 py-1 rounded text-xs ${appState.selectedRoomId ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                >
                  Place
                </button>
              </div>
            ))}
          </div>

          {/* Placed Objects */}
          <h3 className="text-sm font-medium text-gray-700 mt-4 mb-2">Placed Objects</h3>
          <div className="space-y-2">
            {(appState.placedObjects ?? []).map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="flex-1 text-sm">{(appState.objectDefs ?? []).find((d)=>d.id===p.defId)?.name}</div>
                <button onClick={() => handleDuplicatePlaced(p.id)} className="px-2 py-1 bg-gray-200 rounded text-xs">Duplicate</button>
                <button
                  onClick={() => {
                    const current = p.rotationDeg ?? 0;
                    const newState = State.updatePlacedObjectRotation(appState, p.id, (current + 90) % 360);
                    setAppState(newState);
                  }}
                  className="px-2 py-1 bg-gray-200 rounded text-xs"
                >
                  Rotate
                </button>
              </div>
            ))}
          </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Rooms ({appState.rooms.length})</h2>
          <div className="space-y-2">
            {appState.rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleSelectRoom(room.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition font-medium text-sm ${
                  room.id === appState.selectedRoomId
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel: SVG Editor */}
      <div className="flex-1 bg-white overflow-hidden flex flex-col">
        {/* Zoom Controls */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
          <button
            onClick={() => {
              const newZoom = Math.max(0.1, appState.zoom - 0.2);
              const newState = State.updateViewport(appState, appState.panX, appState.panY, newZoom);
              setAppState(newState);
            }}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
          >
            −
          </button>
          <span className="text-sm font-medium text-gray-600 w-16 text-center">
            {Math.round(appState.zoom * 100)}%
          </span>
          <button
            onClick={() => {
              const newZoom = Math.min(3, appState.zoom + 0.2);
              const newState = State.updateViewport(appState, appState.panX, appState.panY, newZoom);
              setAppState(newState);
            }}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium"
          >
            +
          </button>
          <button
            onClick={() => {
              const newState = State.updateViewport(appState, 50, 50, 1);
              setAppState(newState);
            }}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium ml-2"
          >
            Reset
          </button>
          <span className="text-xs text-gray-500 ml-auto">Scroll to zoom</span>
        </div>

        {/* SVG canvas container with overlay */}
        <div className="relative flex-1 w-full h-full">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className={`absolute inset-0 bg-gray-50 ${isDraggingRoom ? 'cursor-grabbing' : 'cursor-move'}`}
            onPointerDown={handleSvgPointerDown}
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerCancel={handleSvgPointerUp}
            onPointerLeave={handleSvgPointerUp}
            onWheel={handleSvgWheel}
            viewBox="0 0 10000 10000"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Use SVG transform attribute (reliable), not CSS transform */}
            <g transform={`translate(${appState.panX} ${appState.panY}) scale(${appState.zoom})`}>
              {/* Background grid (optional) */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="10000" height="10000" fill="url(#grid)" />

              {/* Rooms with walls */}
              {appState.rooms.map((room) => {
                const wallThickness = {
                  north: room.wallThickness?.north ?? appState.globalWallThicknessCm,
                  south: room.wallThickness?.south ?? appState.globalWallThicknessCm,
                  east: room.wallThickness?.east ?? appState.globalWallThicknessCm,
                  west: room.wallThickness?.west ?? appState.globalWallThicknessCm,
                };

                const scale = SCALE;
                const x = room.xCm * scale;
                const y = room.yCm * scale;
                const w = room.widthCm * scale;
                const h = room.heightCm * scale;

                const selected = room.id === appState.selectedRoomId;
                const draggingThis = dragState?.roomId === room.id;

                return (
                  <React.Fragment key={room.id}>
                    {/* Wall rectangles */}
                    {(() => {
                      const n = wallThickness.north * scale;
                      const s = wallThickness.south * scale;
                      const eT = wallThickness.east * scale;
                      const wT = wallThickness.west * scale;

                      // Outer extents:
                      // West wall sits left of x, East wall sits right of x+w
                      // North wall sits above y, South wall sits below y+h
                      const outerX = x - wT;
                      const outerY = y - n;
                      const outerW = w + wT + eT;
                      const outerH = h + n + s;

                      const wallFill = '#8b7355';

                      return (
                        <>
                          {/* North wall (above room, spans full outer width) */}
                          <rect
                            x={outerX}
                            y={y - n}
                            width={outerW}
                            height={n}
                            fill={wallFill}
                            opacity="0.6"
                            pointerEvents="none"
                          />

                          {/* South wall (below room, spans full outer width) */}
                          <rect
                            x={outerX}
                            y={y + h}
                            width={outerW}
                            height={s}
                            fill={wallFill}
                            opacity="0.6"
                            pointerEvents="none"
                          />

                          {/* West wall (left of room, spans full outer height) */}
                          <rect
                            x={x - wT}
                            y={outerY}
                            width={wT}
                            height={outerH}
                            fill={wallFill}
                            opacity="0.6"
                            pointerEvents="none"
                          />

                          {/* East wall (right of room, spans full outer height) */}
                          <rect
                            x={x + w}
                            y={outerY}
                            width={eT}
                            height={outerH}
                            fill={wallFill}
                            opacity="0.6"
                            pointerEvents="none"
                          />
                        </>
                      );
                    })()}

                    {/* Room rectangle (clickable, with data-room-id for event delegation) */}
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      data-room-id={room.id}
                      fill={selected ? 'rgba(37, 99, 235, 0.1)' : 'rgba(229, 231, 235, 0.5)'}
                      stroke={selected ? '#2563eb' : '#d1d5db'}
                      strokeWidth={selected ? 3 : 2}
                      style={{ cursor: draggingThis ? 'grabbing' : 'grab' }}
                    />

                    {/* Placed objects inside this room */}
                    {(appState.placedObjects ?? []).filter((p) => p.roomId === room.id).map((p) => {
                      const def = appState.objectDefs?.find((d) => d.id === p.defId);
                      if (!def) return null;
                      const ox = p.xCm * scale;
                      const oy = p.yCm * scale;
                      const ow = def.widthCm * scale;
                      const oh = def.heightCm * scale;
                      const draggingPlaced = dragState?.roomId === p.id && (dragState as any).targetType === 'placed';
                      const rotation = p.rotationDeg ?? 0;
                      return (
                        <g key={p.id} data-placed-id={p.id} transform={`rotate(${rotation} ${ox + ow / 2} ${oy + oh / 2})`} style={{ cursor: draggingPlaced ? 'grabbing' : 'grab' }}>
                          <rect x={ox} y={oy} width={ow} height={oh} fill="#c7e1ff" stroke="#0369a1" strokeWidth={1} />
                          <text x={ox + ow/2} y={oy + oh/2} textAnchor="middle" dominantBaseline="middle" fontSize={10} pointerEvents="none" fill="#023047">{def.name}</text>
                        </g>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Snap indicators */}
              {snap && snap.snappedX && (
                <line
                  x1={(snap.xGuideCm ?? snap.xCm)! * SCALE}
                  y1="0"
                  x2={(snap.xGuideCm ?? snap.xCm)! * SCALE}
                  y2="10000"
                  stroke="#ec4899"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.6"
                  pointerEvents="none"
                />
              )}
              {snap && snap.snappedY && (
                <line
                  x1="0"
                  y1={(snap.yGuideCm ?? snap.yCm)! * SCALE}
                  x2="10000"
                  y2={(snap.yGuideCm ?? snap.yCm)! * SCALE}
                  stroke="#ec4899"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.6"
                  pointerEvents="none"
                />
              )}
            </g>
          </svg>

          {/* HTML overlay for room name labels (fixed font-size, always readable) */}
          <div className="pointer-events-none absolute inset-0 z-10">
            {roomLabelPositions.map((label) => {
              const room = appState.rooms.find((r) => r.id === label.roomId);
              return (
                <div
                  key={label.roomId}
                  style={{
                    position: 'absolute',
                    left: `${label.x}px`,
                    top: `${label.y}px`,
                    transform: 'translate(-50%, -110%)',
                    fontSize: '13px',
                    lineHeight: '16px',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    zIndex: 20,
                  }}
                  className={`rounded-md px-2 py-1 shadow-sm border ${
                    label.isSelected ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white/90 border-gray-200 text-gray-700'
                  }`}
                >
                  <div>{room?.name}</div>
                </div>
              );
            })}

            {placedLabelPositions.map((label) => {
              const placed = (appState.placedObjects ?? []).find((p) => p.id === label.placedId);
              const def = placed ? (appState.objectDefs ?? []).find((d) => d.id === placed.defId) : undefined;
              if (!placed || !def) return null;
              return (
                <div
                  key={label.placedId}
                  style={{
                    position: 'absolute',
                    left: `${label.x}px`,
                    top: `${label.y}px`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: '13px',
                    lineHeight: '16px',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    zIndex: 20,
                  }}
                >
                  <div className="rounded-md px-2 py-1 shadow-sm border bg-white/90 border-gray-200 text-gray-700">{def.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel: Selected Room Properties */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-6 shadow-sm">
        {selectedRoom ? (
          <RoomPropertiesPanel
            room={selectedRoom}
            globalWallThickness={appState.globalWallThicknessCm}
            onUpdateName={handleUpdateRoomName}
            onUpdateDimensions={handleUpdateRoomDimensions}
            onUpdateWallThickness={handleUpdateRoomWallThickness}
            onDelete={handleDeleteRoom}
          />
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>Select a room to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Add Room Form Component
 */
interface AddRoomFormProps {
  onAddRoom: (name: string, widthCm: number, heightCm: number) => void;
}

function AddRoomForm({ onAddRoom }: AddRoomFormProps) {
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Living Room"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
        <input
          type="number"
          min="1"
          value={widthCm}
          onChange={(e) => setWidthCm(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
        <input
          type="number"
          min="1"
          value={heightCm}
          onChange={(e) => setHeightCm(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
      >
        Add Room
      </button>
    </form>
  );
}

/**
 * Object Definition Form
 */
interface ObjectDefFormProps {
  onAdd: (name: string, widthCm: number, heightCm: number) => void;
}

function ObjectDefForm({ onAdd }: ObjectDefFormProps) {
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
    <form onSubmit={submit} className="space-y-2 mb-2">
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
      <div className="flex gap-2">
        <input type="number" min={1} value={widthCm} onChange={(e)=>setWidthCm(Number(e.target.value))} className="w-1/2 px-2 py-1 border rounded text-sm" />
        <input type="number" min={1} value={heightCm} onChange={(e)=>setHeightCm(Number(e.target.value))} className="w-1/2 px-2 py-1 border rounded text-sm" />
      </div>
      <button type="submit" className="w-full px-2 py-1 bg-green-600 text-white rounded text-sm">Add Object</button>
    </form>
  );
}

/**
 * Room Properties Panel Component
 */
interface RoomPropertiesPanelProps {
  room: Room;
  globalWallThickness: number;
  onUpdateName: (roomId: string, name: string) => void;
  onUpdateDimensions: (roomId: string, widthCm: number, heightCm: number) => void;
  onUpdateWallThickness: (roomId: string, wallThickness: any) => void;
  onDelete: (roomId: string) => void;
}

function RoomPropertiesPanel({
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
  const [wallNorth, setWallNorth] = useState(room.wallThickness?.north ?? '');
  const [wallSouth, setWallSouth] = useState(room.wallThickness?.south ?? '');
  const [wallEast, setWallEast] = useState(room.wallThickness?.east ?? '');
  const [wallWest, setWallWest] = useState(room.wallThickness?.west ?? '');

  // Keep panel inputs in sync when selecting another room
  useEffect(() => {
    setName(room.name);
    setWidthCm(room.widthCm);
    setHeightCm(room.heightCm);
    setWallNorth(room.wallThickness?.north ?? '');
    setWallSouth(room.wallThickness?.south ?? '');
    setWallEast(room.wallThickness?.east ?? '');
    setWallWest(room.wallThickness?.west ?? '');
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Room Properties</h2>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Dimensions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
        <input
          type="number"
          min="1"
          step="10"
          value={widthCm}
          onChange={(e) => setWidthCm(Number(e.target.value))}
          onBlur={handleDimensionsChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
        <input
          type="number"
          min="1"
          step="10"
          value={heightCm}
          onChange={(e) => setHeightCm(Number(e.target.value))}
          onBlur={handleDimensionsChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Wall Thickness */}
      <div className="mb-6 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Wall Thickness (cm)</h3>
        <p className="text-xs text-gray-500 mb-3">
          Leave empty to use global default ({globalWallThickness}cm)
        </p>

        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">North</label>
            <input
              type="number"
              min="0"
              step="1"
              value={wallNorth}
              onChange={(e) => setWallNorth(e.target.value)}
              onBlur={handleWallThicknessChange}
              placeholder="Default"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">South</label>
            <input
              type="number"
              min="0"
              step="1"
              value={wallSouth}
              onChange={(e) => setWallSouth(e.target.value)}
              onBlur={handleWallThicknessChange}
              placeholder="Default"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">East</label>
            <input
              type="number"
              min="0"
              step="1"
              value={wallEast}
              onChange={(e) => setWallEast(e.target.value)}
              onBlur={handleWallThicknessChange}
              placeholder="Default"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">West</label>
            <input
              type="number"
              min="0"
              step="1"
              value={wallWest}
              onChange={(e) => setWallWest(e.target.value)}
              onBlur={handleWallThicknessChange}
              placeholder="Default"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
      >
        Delete Room
      </button>
    </div>
  );
}
