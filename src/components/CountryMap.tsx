"use client";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { COUNTRY_CENTER, ISO_NUMERIC_TO_ALPHA3 } from "@/lib/countries-catalog";
import type { Country } from "@/lib/types";
import { PIN_COLORS } from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props {
  country: Country;
}

export default function CountryMap({ country }: Props) {
  const config = COUNTRY_CENTER[country.code] ?? { center: [0, 0], zoom: 1 };

  return (
    <div className="w-full bg-[#0d3b6e] border-2 border-[#29b6f6] relative overflow-hidden">
      <ComposableMap
        projection="geoMercator"
        width={400}
        height={300}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup center={config.center} zoom={config.zoom} minZoom={1} maxZoom={10}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = geo.id as string;
                const code = ISO_NUMERIC_TO_ALPHA3[numericId];
                const isFocus = code === country.code;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: isFocus ? (code === "BRA" ? "#39ff1466" : "#00b4d866") : "#0d2f52",
                        stroke: isFocus ? (code === "BRA" ? "#39ff14" : "#00e5ff") : "#ffffff",
                        strokeWidth: isFocus ? 1 : 0.3,
                        outline: "none",
                      },
                      hover: { outline: "none", fill: isFocus ? "#00d4f8aa" : "#0d2f52" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* All pins for this country */}
          {country.pins.map((pin) => (
            <Marker key={pin.id} coordinates={[pin.lng, pin.lat]}>
              <g className="pointer-events-none">
                {/* 📍 teardrop */}
                <path
                  d="M 0,0 L -10,-20 A 10,10 0 1,1 10,-20 Z"
                  fill={PIN_COLORS[pin.type]}
                  stroke="#01579b"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
                {/* inner circle highlight */}
                <circle cx={0} cy={-26} r={4} fill="rgba(255,255,255,0.3)" />
                {/* label */}
                <text
                  textAnchor="middle"
                  y={14}
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 4,
                    fill: PIN_COLORS[pin.type],
                    stroke: "#01579b",
                    strokeWidth: 2,
                    paintOrder: "stroke",
                    pointerEvents: "none",
                  }}
                >
                  {pin.name.slice(0, 16)}
                </text>
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Grid overlay for pixel art feel */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,229,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.04)_1px,transparent_1px)] [background-size:20px_20px]" />
    </div>
  );
}
