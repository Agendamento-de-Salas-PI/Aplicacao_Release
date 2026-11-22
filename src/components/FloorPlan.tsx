"use client";

import { useEffect, useRef, useState } from "react";
import { type Bloco, type Sala } from "@/types";
import { Icon } from "./Icon";

interface FloorPlanProps {
  block: Bloco;
  rooms: Sala[];
  matchedRoomIds: Set<number>;
  selected: Sala | null;
  onSelect: (r: Sala) => void;
}

interface ParsedSvgRect {
  id: string;
  className: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

interface ParsedSvgData {
  viewBox: string;
  groupId: string;
  rects: ParsedSvgRect[];
}

export default function FloorPlan({
  block,
  rooms,
  matchedRoomIds,
  selected,
  onSelect,
}: FloorPlanProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const didMoveRef = useRef(false);
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchInitialZoomRef = useRef<number>(1);
  const [svgData, setSvgData] = useState<ParsedSvgData | null>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((z) =>
      Math.min(2.5, Math.max(0.6, Number((z + delta).toFixed(2))))
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    didMoveRef.current = false;
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStartRef.current.x;
    const nextY = e.clientY - dragStartRef.current.y;
    if (Math.abs(nextX - pan.x) > 4 || Math.abs(nextY - pan.y) > 4) {
      didMoveRef.current = true;
    }
    setPan({ x: nextX, y: nextY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      didMoveRef.current = false;
      pinchDistanceRef.current = null;
      dragStartRef.current = {
        x: t.clientX - pan.x,
        y: t.clientY - pan.y,
      };
    } else if (e.touches.length === 2) {
      setIsDragging(true);
      didMoveRef.current = true;
      pinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
      pinchInitialZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchDistanceRef.current) {
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const ratio = currentDist / pinchDistanceRef.current;
      const nextZoom = Math.min(
        2.5,
        Math.max(0.6, Number((pinchInitialZoomRef.current * ratio).toFixed(2)))
      );
      setZoom(nextZoom);
      didMoveRef.current = true;
    } else if (e.touches.length === 1 && isDragging && !pinchDistanceRef.current) {
      const t = e.touches[0];
      const nextX = t.clientX - dragStartRef.current.x;
      const nextY = t.clientY - dragStartRef.current.y;
      if (Math.abs(nextX - pan.x) > 5 || Math.abs(nextY - pan.y) > 5) {
        didMoveRef.current = true;
      }
      setPan({ x: nextX, y: nextY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      pinchDistanceRef.current = null;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      pinchDistanceRef.current = null;
      dragStartRef.current = {
        x: t.clientX - pan.x,
        y: t.clientY - pan.y,
      };
    }
  };

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    let active = true;
    const url = block.svgUrl ?? `/bloco-${block.id}.svg`;

    fetch(url)
      .then((res) => res.text())
      .then((xmlText) => {
        if (!active) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "image/svg+xml");
        const svgEl = doc.querySelector("svg");
        const viewBox =
          svgEl?.getAttribute("viewBox") ?? block.svgViewBox ?? "0 0 507 980";
        const groupEl = doc.querySelector("g");
        const groupId = groupEl?.getAttribute("id") ?? `Bloco-${block.id}`;

        const rectElements = Array.from(doc.querySelectorAll("rect"));
        const rects: ParsedSvgRect[] = rectElements.map((el, index) => ({
          id: el.getAttribute("id") ?? `rect-${index}`,
          className: el.getAttribute("class") ?? "",
          x: Number(el.getAttribute("x") ?? 0),
          y: Number(el.getAttribute("y") ?? 0),
          width: Number(el.getAttribute("width") ?? 0),
          height: Number(el.getAttribute("height") ?? 0),
          fill: el.getAttribute("fill") ?? "#757575",
        }));

        setSvgData({ viewBox, groupId, rects });
      })
      .catch(() => {
        // Fallback caso o fetch falhe
      });

    return () => {
      active = false;
    };
  }, [block.id, block.svgUrl, block.svgViewBox]);

  const viewBox = svgData?.viewBox ?? block.svgViewBox ?? "0 0 507 980";
  const rects = svgData?.rects ?? [];

  return (
    <div
      className={`floor-wrap ${isDragging ? "dragging" : ""}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="compass" aria-hidden="true">
        <span>N</span>
        <Icon name="arrow" size={16} />
      </div>

      <svg
        className="floor-plan"
        viewBox={viewBox}
        role="img"
        aria-label={`Planta interativa de ${block.descritivo}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? "none" : "transform 0.15s ease-out",
          maxWidth: "390px",
          maxHeight: "76vh",
        }}
      >
        <g id={svgData?.groupId ?? "Block-Frame"}>
          {rects.map((rectEl) => {
            const { id, className, x, y, width: w, height: h, fill } = rectEl;

            // Fundo do bloco (block-bg)
            if (className.includes("block-bg") || id.startsWith("Bg-")) {
              return (
                <g key={id}>
                  <rect
                    id={id}
                    className={className}
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={fill}
                    rx={6}
                    stroke="#34383d"
                    strokeWidth="4"
                  />
                  <text
                    className="hall-text"
                    x={w / 2}
                    y={h / 2}
                    textAnchor="middle"
                    transform={`rotate(-90 ${w / 2} ${h / 2})`}
                  >
                    CORREDOR CENTRAL · {block.descritivo.toUpperCase()}
                  </text>
                </g>
              );
            }

            // Cruzar o id do <rect> com sala.codigoSvg das salas cadastradas neste bloco
            const room = rooms.find((r) => r.codigoSvg === id);

            // Instalações não agendáveis (ex: banheiros A-WC-MASC, A-WC-FEM, B-WC-FEM, B-WC-MASC)
            if (!room) {
              const isWc = id.includes("WC") || className.includes("wc");
              const wcLabel = id.includes("FEM")
                ? "WC FEMININO"
                : id.includes("MASC")
                  ? "WC MASCULINO"
                  : id;

              return (
                <g key={id} id={id}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={fill}
                    rx={4}
                    stroke="#7a7f87"
                    strokeWidth="1.5"
                  />
                  {isWc && (
                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 4}
                      textAnchor="middle"
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        fill: "#383c42",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {wcLabel}
                    </text>
                  )}
                </g>
              );
            }

            const isSelected = selected?.id === room.id;
            const statusClass =
              room.statusOcupacao === "Ocupada"
                ? "busy"
                : room.statusOcupacao === "Em breve"
                  ? "soon"
                  : "free";
            const isFilteredOut = !matchedRoomIds.has(room.id);

            return (
              <g
                key={id}
                id={id}
                className={`room-shape ${statusClass} ${
                  isSelected ? "selected" : ""
                } ${isFilteredOut ? "filtered-out" : ""}`}
                onClick={() => {
                  if (didMoveRef.current) return;
                  onSelect(room);
                }}
                tabIndex={0}
                role="button"
                aria-label={`${room.descritivo} - ${room.statusOcupacao} - ${room.capacidade} lugares`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(room);
                  }
                }}
              >
                <rect
                  id={id}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={4}
                  fill={fill}
                />
                <text x={x + 14} y={y + 26}>
                  {room.descritivo}
                </text>
                <text
                  x={x + 14}
                  y={y + 44}
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    fill: "#5b6168",
                  }}
                >
                  {room.capacidade} lugares
                </text>
                <circle cx={x + 16} cy={y + h - 16} r="4.5" />
                <text className="status-text" x={x + 27} y={y + h - 12}>
                  {room.statusOcupacao}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div
        className="map-controls"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Aumentar zoom"
          onClick={() =>
            setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))
          }
        >
          +
        </button>
        <button
          type="button"
          aria-label="Diminuir zoom"
          onClick={() =>
            setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))
          }
        >
          −
        </button>
        <button
          type="button"
          aria-label="Centralizar mapa"
          onClick={resetCamera}
        >
          ⌖
        </button>
      </div>

      <div className="legend">
        <span>
          <i className="free" />
          Livre
        </span>
        <span>
          <i className="soon" />
          Em breve (Pendente)
        </span>
        <span>
          <i className="busy" />
          Ocupada
        </span>
      </div>
    </div>
  );
}
