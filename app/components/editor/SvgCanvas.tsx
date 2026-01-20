'use client';

import React from 'react';
import { AppState, ExtendedDragState, MeasurePoint, WallSide, WallOpening, Room, ToolMode } from '@/src/model/types';
import * as State from '@/src/model/state';
import * as Snap from '@/src/editor/Snap';
import { SCALE } from '@/app/components/constants/editor';

interface SvgCanvasProps {
  appState: AppState;
  svgRef: React.RefObject<SVGSVGElement | null>;
  dragState: ExtendedDragState | null;
  snap: Snap.SnapResult | null;
  measurePoints: MeasurePoint[];
  measureDistance: number | null;
  toolMode: ToolMode;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  onWheel: (e: React.WheelEvent<SVGSVGElement>) => void;
}

// Wall rendering data type
type WallRenderData = {
  key: string;
  roomId: string;
  wallSide: WallSide;
  baseX: number;
  baseY: number;
  wallWidth: number;
  wallHeight: number;
  isHorizontal: boolean;
  hasOpenings: boolean;
  openings: WallOpening[];
  shouldRender: boolean;
  openingOffset: number;
};

export default function SvgCanvas({
  appState,
  svgRef,
  dragState,
  snap,
  measurePoints,
  measureDistance,
  toolMode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
}: SvgCanvasProps) {
  const isDraggingRoom = dragState && dragState.roomId !== '__pan__';

  // Compute wall rendering data
  const { wallsWithoutOpenings, wallsWithOpenings } = React.useMemo(() => {
    const wallsWithoutOpenings: WallRenderData[] = [];
    const wallsWithOpenings: WallRenderData[] = [];
    
    appState.rooms.forEach((room) => {
      const wallThicknessData = {
        north: room.wallThickness?.north ?? appState.globalWallThicknessCm,
        south: room.wallThickness?.south ?? appState.globalWallThicknessCm,
        east: room.wallThickness?.east ?? appState.globalWallThicknessCm,
        west: room.wallThickness?.west ?? appState.globalWallThicknessCm,
      };
      
      const x = room.xCm * SCALE;
      const y = room.yCm * SCALE;
      const w = room.widthCm * SCALE;
      const h = room.heightCm * SCALE;
      
      const n = wallThicknessData.north * SCALE;
      const s = wallThicknessData.south * SCALE;
      const eT = wallThicknessData.east * SCALE;
      const wT = wallThicknessData.west * SCALE;
      
      const outerX = x - wT;
      const outerY = y - n;
      const outerW = w + wT + eT;
      const outerH = h + n + s;
      
      const roomOpenings = State.getOpeningsForRoom(appState, room.id);
      
      const adjacentNorth = State.findAdjacentRoom(appState, room, 'north');
      const adjacentSouth = State.findAdjacentRoom(appState, room, 'south');
      const adjacentEast = State.findAdjacentRoom(appState, room, 'east');
      const adjacentWest = State.findAdjacentRoom(appState, room, 'west');
      
      const wallConfigs = [
        { side: 'north' as WallSide, baseX: outerX, baseY: y - n, width: outerW, height: n, isHorizontal: true, adjacent: adjacentNorth, openingOffset: wT },
        { side: 'south' as WallSide, baseX: outerX, baseY: y + h, width: outerW, height: s, isHorizontal: true, adjacent: adjacentSouth, openingOffset: wT },
        { side: 'west' as WallSide, baseX: x - wT, baseY: outerY, width: wT, height: outerH, isHorizontal: false, adjacent: adjacentWest, openingOffset: n },
        { side: 'east' as WallSide, baseX: x + w, baseY: outerY, width: eT, height: outerH, isHorizontal: false, adjacent: adjacentEast, openingOffset: n },
      ];
      
      wallConfigs.forEach((config) => {
        let shouldRender = true;
        let openings: WallOpening[] = [];
        
        if (config.adjacent) {
          openings = State.getCombinedWallOpenings(appState, room, config.side, config.adjacent);
          const myOpenings = roomOpenings.filter((o) => o.wall === config.side);
          const otherRoomOpenings = State.getOpeningsForWall(appState, config.adjacent.otherRoom.id, config.adjacent.otherWall);
          
          if (myOpenings.length > 0 || otherRoomOpenings.length > 0) {
            if (myOpenings.length > 0 && otherRoomOpenings.length > 0) {
              shouldRender = State.shouldRenderSharedWall(room, config.adjacent.otherRoom);
            } else {
              shouldRender = myOpenings.length > 0;
            }
          } else {
            shouldRender = State.shouldRenderSharedWall(room, config.adjacent.otherRoom);
          }
        } else {
          openings = roomOpenings.filter((o) => o.wall === config.side);
        }
        
        const wallData: WallRenderData = {
          key: `${room.id}-${config.side}`,
          roomId: room.id,
          wallSide: config.side,
          baseX: config.baseX,
          baseY: config.baseY,
          wallWidth: config.width,
          wallHeight: config.height,
          isHorizontal: config.isHorizontal,
          hasOpenings: openings.length > 0,
          openings,
          shouldRender,
          openingOffset: config.openingOffset,
        };
        
        if (shouldRender) {
          if (openings.length > 0) {
            wallsWithOpenings.push(wallData);
          } else {
            wallsWithoutOpenings.push(wallData);
          }
        }
      });
    });
    
    return { wallsWithoutOpenings, wallsWithOpenings };
  }, [appState]);

  const wallFill = '#8b7355';

  const renderWall = (wall: WallRenderData) => {
    if (wall.openings.length === 0) {
      return (
        <rect
          key={wall.key}
          x={wall.baseX}
          y={wall.baseY}
          width={wall.wallWidth}
          height={wall.wallHeight}
          fill={wallFill}
          opacity="0.6"
          pointerEvents="none"
        />
      );
    }
    
    const sortedOpenings = [...wall.openings].sort((a, b) => a.positionCm - b.positionCm);
    const segments: React.ReactNode[] = [];
    let currentPos = 0;
    
    sortedOpenings.forEach((opening, i) => {
      const openingStart = opening.positionCm * SCALE + wall.openingOffset;
      const openingWidth = opening.widthCm * SCALE;
      
      if (openingStart > currentPos) {
        if (wall.isHorizontal) {
          segments.push(
            <rect key={`${wall.key}-seg-${i}-before`} x={wall.baseX + currentPos} y={wall.baseY} width={openingStart - currentPos} height={wall.wallHeight} fill={wallFill} opacity="0.6" pointerEvents="none" />
          );
        } else {
          segments.push(
            <rect key={`${wall.key}-seg-${i}-before`} x={wall.baseX} y={wall.baseY + currentPos} width={wall.wallWidth} height={openingStart - currentPos} fill={wallFill} opacity="0.6" pointerEvents="none" />
          );
        }
      }
      
      if (wall.isHorizontal) {
        segments.push(<rect key={`${wall.key}-door-bg-${i}`} x={wall.baseX + openingStart} y={wall.baseY} width={openingWidth} height={wall.wallHeight} fill="#f8fafc" pointerEvents="none" />);
        segments.push(<line key={`${wall.key}-door-${i}`} x1={wall.baseX + openingStart} y1={wall.baseY + wall.wallHeight / 2} x2={wall.baseX + openingStart + openingWidth} y2={wall.baseY + wall.wallHeight / 2} stroke="#4ade80" strokeWidth={3} strokeDasharray="8,4" pointerEvents="none" />);
      } else {
        segments.push(<rect key={`${wall.key}-door-bg-${i}`} x={wall.baseX} y={wall.baseY + openingStart} width={wall.wallWidth} height={openingWidth} fill="#f8fafc" pointerEvents="none" />);
        segments.push(<line key={`${wall.key}-door-${i}`} x1={wall.baseX + wall.wallWidth / 2} y1={wall.baseY + openingStart} x2={wall.baseX + wall.wallWidth / 2} y2={wall.baseY + openingStart + openingWidth} stroke="#4ade80" strokeWidth={3} strokeDasharray="8,4" pointerEvents="none" />);
      }
      
      currentPos = openingStart + openingWidth;
    });
    
    const totalLength = wall.isHorizontal ? wall.wallWidth : wall.wallHeight;
    if (currentPos < totalLength) {
      if (wall.isHorizontal) {
        segments.push(<rect key={`${wall.key}-seg-after`} x={wall.baseX + currentPos} y={wall.baseY} width={totalLength - currentPos} height={wall.wallHeight} fill={wallFill} opacity="0.6" pointerEvents="none" />);
      } else {
        segments.push(<rect key={`${wall.key}-seg-after`} x={wall.baseX} y={wall.baseY + currentPos} width={wall.wallWidth} height={totalLength - currentPos} fill={wallFill} opacity="0.6" pointerEvents="none" />);
      }
    }
    
    return <React.Fragment key={wall.key}>{segments}</React.Fragment>;
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      className={`absolute inset-0 bg-slate-50 ${toolMode === 'measure' ? 'cursor-crosshair' : isDraggingRoom ? 'cursor-grabbing' : 'cursor-move'}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      viewBox="0 0 10000 10000"
      preserveAspectRatio="xMidYMid meet"
    >
      <g transform={`translate(${appState.panX} ${appState.panY}) scale(${appState.zoom})`}>
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
          <pattern id="gridLarge" width="250" height="250" patternUnits="userSpaceOnUse">
            <path d="M 250 0 L 0 0 0 250" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="10000" height="10000" fill="url(#grid)" />
        <rect width="10000" height="10000" fill="url(#gridLarge)" />

        {/* Walls without openings first (lower z-index) */}
        {wallsWithoutOpenings.map(renderWall)}
        {/* Walls with openings last (higher z-index) */}
        {wallsWithOpenings.map(renderWall)}

        {/* Rooms */}
        {appState.rooms.map((room) => (
          <RoomElement
            key={room.id}
            room={room}
            appState={appState}
            dragState={dragState}
          />
        ))}

        {/* Snap indicators */}
        {snap?.snappedX && (
          <line x1={(snap.xGuideCm ?? snap.xCm)! * SCALE} y1="0" x2={(snap.xGuideCm ?? snap.xCm)! * SCALE} y2="10000" stroke="#ec4899" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" pointerEvents="none" />
        )}
        {snap?.snappedY && (
          <line x1="0" y1={(snap.yGuideCm ?? snap.yCm)! * SCALE} x2="10000" y2={(snap.yGuideCm ?? snap.yCm)! * SCALE} stroke="#ec4899" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" pointerEvents="none" />
        )}

        {/* Measurement tool */}
        {measurePoints.length > 0 && (
          <>
            <circle cx={measurePoints[0].xCm * SCALE} cy={measurePoints[0].yCm * SCALE} r={8 / appState.zoom} fill="#f59e0b" stroke="#fff" strokeWidth={2 / appState.zoom} pointerEvents="none" />
            {measurePoints.length === 2 && (
              <>
                <line x1={measurePoints[0].xCm * SCALE} y1={measurePoints[0].yCm * SCALE} x2={measurePoints[1].xCm * SCALE} y2={measurePoints[1].yCm * SCALE} stroke="#f59e0b" strokeWidth={3 / appState.zoom} strokeDasharray={`${10 / appState.zoom},${5 / appState.zoom}`} pointerEvents="none" />
                <circle cx={measurePoints[1].xCm * SCALE} cy={measurePoints[1].yCm * SCALE} r={8 / appState.zoom} fill="#f59e0b" stroke="#fff" strokeWidth={2 / appState.zoom} pointerEvents="none" />
                <text x={(measurePoints[0].xCm + measurePoints[1].xCm) / 2 * SCALE} y={(measurePoints[0].yCm + measurePoints[1].yCm) / 2 * SCALE - 15 / appState.zoom} textAnchor="middle" fontSize={16 / appState.zoom} fill="#f59e0b" fontWeight="bold" pointerEvents="none">
                  {measureDistance?.toFixed(1)} cm
                </text>
              </>
            )}
          </>
        )}
      </g>
    </svg>
  );
}

// Room element sub-component
function RoomElement({ room, appState, dragState }: { room: Room; appState: AppState; dragState: ExtendedDragState | null }) {
  const x = room.xCm * SCALE;
  const y = room.yCm * SCALE;
  const w = room.widthCm * SCALE;
  const h = room.heightCm * SCALE;
  const selected = appState.selectedRoomIds.includes(room.id);
  const draggingThis = dragState?.roomId === room.id;
  const handleSize = 40 / appState.zoom;

  return (
    <React.Fragment>
      <rect
        x={x} y={y} width={w} height={h}
        data-room-id={room.id}
        fill={selected ? 'rgba(37, 99, 235, 0.1)' : 'rgba(229, 231, 235, 0.5)'}
        stroke={selected ? '#2563eb' : '#d1d5db'}
        strokeWidth={selected ? 3 : 2}
        style={{ cursor: draggingThis ? 'grabbing' : 'grab' }}
      />

      {/* Resize handles */}
      {selected && (
        <>
          <rect x={x - handleSize / 2} y={y - handleSize / 2} width={handleSize} height={handleSize} fill="#2563eb" stroke="#fff" strokeWidth={1} data-resize-handle="nw" data-room-id={room.id} style={{ cursor: 'nwse-resize' }} />
          <rect x={x + w - handleSize / 2} y={y - handleSize / 2} width={handleSize} height={handleSize} fill="#2563eb" stroke="#fff" strokeWidth={1} data-resize-handle="ne" data-room-id={room.id} style={{ cursor: 'nesw-resize' }} />
          <rect x={x - handleSize / 2} y={y + h - handleSize / 2} width={handleSize} height={handleSize} fill="#2563eb" stroke="#fff" strokeWidth={1} data-resize-handle="sw" data-room-id={room.id} style={{ cursor: 'nesw-resize' }} />
          <rect x={x + w - handleSize / 2} y={y + h - handleSize / 2} width={handleSize} height={handleSize} fill="#2563eb" stroke="#fff" strokeWidth={1} data-resize-handle="se" data-room-id={room.id} style={{ cursor: 'nwse-resize' }} />
          <rect x={x + w / 2 - handleSize / 2} y={y - handleSize / 2} width={handleSize} height={handleSize} fill="#2563eb" stroke="#fff" strokeWidth={1} data-resize-handle="n" data-room-id={room.id} style={{ cursor: 'ns-resize' }} />
          <rect x={x + w / 2 - handleSize / 2} y={y + h - handleSize / 2} width={handleSize} height={handleSize} fill="#2563eb" stroke="#fff" strokeWidth={1} data-resize-handle="s" data-room-id={room.id} style={{ cursor: 'ns-resize' }} />
          <rect x={x - handleSize / 2} y={y + h / 2 - handleSize / 2} width={handleSize} height={handleSize} fill="#2563eb" stroke="#fff" strokeWidth={1} data-resize-handle="w" data-room-id={room.id} style={{ cursor: 'ew-resize' }} />
          <rect x={x + w - handleSize / 2} y={y + h / 2 - handleSize / 2} width={handleSize} height={handleSize} fill="#2563eb" stroke="#fff" strokeWidth={1} data-resize-handle="e" data-room-id={room.id} style={{ cursor: 'ew-resize' }} />
        </>
      )}

      {/* Placed objects */}
      {(appState.placedObjects ?? []).filter((p) => p.roomId === room.id).map((p) => {
        const def = appState.objectDefs?.find((d) => d.id === p.defId);
        if (!def) return null;
        const ox = p.xCm * SCALE;
        const oy = p.yCm * SCALE;
        const ow = def.widthCm * SCALE;
        const oh = def.heightCm * SCALE;
        const draggingPlaced = dragState?.roomId === p.id && dragState?.targetType === 'placed';
        const isSelectedObject = appState.selectedObjectId === p.id;
        const rotation = p.rotationDeg ?? 0;
        return (
          <g key={p.id} data-placed-id={p.id} transform={`rotate(${rotation} ${ox + ow / 2} ${oy + oh / 2})`} style={{ cursor: draggingPlaced ? 'grabbing' : 'grab' }}>
            <rect x={ox} y={oy} width={ow} height={oh} fill={isSelectedObject ? "#93c5fd" : "#c7e1ff"} stroke={isSelectedObject ? "#2563eb" : "#0369a1"} strokeWidth={isSelectedObject ? 2 : 1} />
            <text x={ox + ow/2} y={oy + oh/2} textAnchor="middle" dominantBaseline="middle" fontSize={10} pointerEvents="none" fill="#023047">{def.name}</text>
          </g>
        );
      })}
    </React.Fragment>
  );
}
