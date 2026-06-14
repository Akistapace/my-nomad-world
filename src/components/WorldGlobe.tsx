"use client";
import type { Country } from "@/lib/types";
import { ISO_NUMERIC_TO_ALPHA3 } from "@/lib/countries-catalog";
import { PIN_COLORS } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props {
  countries: Country[];
  onCountryClick: (code: string) => void;
  showAllPins?: boolean;
  initialRotation?: [number, number, number];
  homeCode?: string;
}

export default function WorldGlobe({ countries, onCountryClick, showAllPins = false, initialRotation = [-45, -10, 0], homeCode }: Props) {
  const [rotation, setRotation] = useState<[number, number, number]>(initialRotation);
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Auto-rotate: gentle X drift, pauses on hover/drag
  useEffect(() => {
    const tick = () => {
      if (!isHovering.current && !isDraggingRef.current) {
        setRotation((r) => [r[0] + 0.06, r[1], r[2]]);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const visitedCodes = new Set(countries.filter((c) => c.visited).map((c) => c.code));

  const allPins = countries.flatMap((c) => c.pins).filter(
    (p) => (p.type === "travel" || p.type === "home") && (p.lat !== 0 || p.lng !== 0)
  );

  const handleMouseEnter = useCallback(() => { isHovering.current = true; }, []);
  const handleMouseLeave = useCallback(() => {
    isHovering.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      setRotation((r) => [r[0] + dx * 0.4, Math.max(-80, Math.min(80, r[1] - dy * 0.4)), r[2]]);
      startPos.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isHovering.current = true;
      isDraggingRef.current = true;
      setIsDragging(true);
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - startPos.current.x;
      const dy = e.touches[0].clientY - startPos.current.y;
      setRotation((r) => [r[0] + dx * 0.4, Math.max(-80, Math.min(80, r[1] - dy * 0.4)), r[2]]);
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    isHovering.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  return (
    <div className="relative w-full flex justify-center">
      {/* Globe outer glow ring */}
      <div
        className={`rounded-full overflow-hidden relative border-2 border-[#29b6f644] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          width: "min(560px, 100vw, calc(100dvh - 130px))",
          height: "min(560px, 100vw, calc(100dvh - 130px))",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ocean background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,#4fc3f7,#0288d1,#01579b)]" />

        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{ rotate: rotation, scale: 272 }}
          width={560}
          height={560}
          style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}
        >
          <defs>
            <radialGradient id="globeShine" cx="35%" cy="35%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = geo.id as string;
                const code = ISO_NUMERIC_TO_ALPHA3[numericId];
                const isVisited = code ? visitedCodes.has(code) : false;
                const isHome = !!homeCode && code === homeCode;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => code && onCountryClick(code)}
                    style={{
                      default: {
                        fill: isHome ? "#39ff14" : isVisited ? "#ffd60a" : "#1a4a2c",
                        stroke: "#0a1a0a",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: {
                        fill: isHome ? "#59ff34" : isVisited ? "#ffe840" : "#2d7a4a",
                        stroke: "#00e5ff",
                        strokeWidth: 1,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "#ffd60a",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {allPins.map((pin) => (
            <Marker key={pin.id} coordinates={[pin.lng, pin.lat]}>
              <g className="pointer-events-none">
                <path
                  d="M 0,0 L -7,-14 A 7,7 0 1,1 7,-14 Z"
                  fill={PIN_COLORS[pin.type]}
                  stroke="#01579b"
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
                <circle cx={0} cy={-18} r={3} fill="rgba(255,255,255,0.3)" />
              </g>
            </Marker>
          ))}

          <circle cx={280} cy={280} r={272} fill="url(#globeShine)" />
        </ComposableMap>

        <div className="absolute inset-0 pointer-events-none rounded-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.06)_2px,rgba(0,0,0,0.06)_4px)]" />
      </div>

      <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 font-pixel text-[8px] text-white whitespace-nowrap">
        ↔ arraste para girar
      </div>
    </div>
  );
}
