"use client";

import { useState } from "react";
import { FACILITY } from "@/lib/config/site";
import { FLOOR_ZONE_LABELS, type ZoneKey } from "@/lib/content/pages/club";
import { cn } from "@/lib/cn";

/**
 * Isometric floor plan built from FACILITY counts. Flat #1c1c20 polygons with
 * hairline edges; hovering, focusing or tapping a zone caption outlines that
 * zone in gold (the artwork's one accent element).
 */

type Zone = { key: ZoneKey; x: number; y: number; w: number; h: number; cx: number; cy: number };

const FLOOR_W = 100;
const FLOOR_H = 52;
const S = 7;
const LINE = "rgba(255,255,255,0.12)";
const LINE_STRONG = "rgba(255,255,255,0.3)";
const FILL = "#1c1c20";
const FLOOR = "#141416";
const GOLD = "#c9a55a";

function iso(x: number, y: number): [number, number] {
  return [330 + (x - y) * S * 0.866, 40 + (x + y) * S * 0.5];
}
function pt(x: number, y: number): string {
  const [px, py] = iso(x, y);
  return `${px.toFixed(1)},${py.toFixed(1)}`;
}
function quad(x: number, y: number, w: number, h: number): string {
  return [pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h)].join(" ");
}
function seg(x1: number, y1: number, x2: number, y2: number): string {
  const [ax, ay] = iso(x1, y1);
  const [bx, by] = iso(x2, y2);
  return `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
}

const ZONES: Zone[] = [
  { key: "lanes", x: 0, y: 0, w: 72, h: 26, cx: 36, cy: 13 },
  { key: "suites", x: 74, y: 0, w: 24, h: 26, cx: 86, cy: 13 },
  { key: "sim", x: 0, y: 30, w: 24, h: 14, cx: 12, cy: 37 },
  { key: "classroom", x: 26, y: 30, w: 18, h: 14, cx: 35, cy: 37 },
  { key: "lounge", x: 46, y: 30, w: 30, h: 20, cx: 61, cy: 40 },
  { key: "lockers", x: 78, y: 30, w: 20, h: 9, cx: 88, cy: 34.5 },
  { key: "desk", x: 78, y: 41, w: 20, h: 9, cx: 88, cy: 45.5 },
];

export function FloorPlan({ className }: { className?: string }) {
  const [active, setActive] = useState<ZoneKey | null>(null);

  const laneCount = FACILITY.laneCount;
  const laneW = 72 / laneCount;
  const suiteCount = FACILITY.suites;
  const suiteW = 24 / suiteCount;
  const bayCount = FACILITY.simulatorBays;
  const bayW = 24 / bayCount;
  const seats = FACILITY.classroomSeats;
  const activeZone = ZONES.find((z) => z.key === active);

  const hover = (key: ZoneKey) => ({
    onMouseEnter: () => setActive(key),
    onMouseLeave: () => setActive((cur) => (cur === key ? null : cur)),
    onClick: () => setActive((cur) => (cur === key ? null : key)),
  });

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox="0 0 960 600" className="h-auto w-full" aria-hidden="true">
        {/* slab */}
        <polygon points={quad(0, 0, FLOOR_W, FLOOR_H)} transform="translate(0 14)" fill="#0a0a0b" stroke={LINE} strokeWidth="1" />
        {[
          [0, FLOOR_H],
          [FLOOR_W, FLOOR_H],
          [FLOOR_W, 0],
        ].map(([x, y]) => (
          <path key={`${x}-${y}`} d={seg(x, y, x, y) + "v14"} stroke={LINE} strokeWidth="1" />
        ))}
        <polygon points={quad(0, 0, FLOOR_W, FLOOR_H)} fill={FLOOR} stroke={LINE} strokeWidth="1" />

        {/* lanes */}
        <g {...hover("lanes")} className="cursor-default">
          {Array.from({ length: laneCount }).map((_, i) => {
            const x = i * laneW;
            return (
              <g key={i}>
                <polygon points={quad(x, 0, laneW, 26)} fill={FILL} stroke={LINE} strokeWidth="1" />
                <circle cx={iso(x + laneW / 2, 2.5)[0]} cy={iso(x + laneW / 2, 2.5)[1]} r="2" fill="none" stroke={LINE_STRONG} strokeWidth="1" />
              </g>
            );
          })}
          <path d={seg(0, 22, 72, 22)} stroke={LINE_STRONG} strokeWidth="1" strokeDasharray="3 3" />
        </g>

        {/* suites */}
        <g {...hover("suites")} className="cursor-default">
          {Array.from({ length: suiteCount }).map((_, i) => {
            const x = 74 + i * suiteW;
            const half = suiteW / 2;
            return (
              <g key={i}>
                <polygon points={quad(x, 0, suiteW, 26)} fill={FILL} stroke={LINE} strokeWidth="1" />
                <path d={seg(x + half, 0, x + half, 18)} stroke={LINE} strokeWidth="1" />
                <path d={seg(x, 18, x + suiteW, 18)} stroke={LINE} strokeWidth="1" />
                <polygon points={quad(x + 2, 21, suiteW - 4, 2.5)} fill="none" stroke={LINE} strokeWidth="1" />
                <circle cx={iso(x + half / 2, 2.5)[0]} cy={iso(x + half / 2, 2.5)[1]} r="2" fill="none" stroke={LINE_STRONG} strokeWidth="1" />
                <circle cx={iso(x + half + half / 2, 2.5)[0]} cy={iso(x + half + half / 2, 2.5)[1]} r="2" fill="none" stroke={LINE_STRONG} strokeWidth="1" />
                {i > 0 && <path d={seg(x, 0, x, 26)} stroke={LINE_STRONG} strokeWidth="1" strokeDasharray="3 3" />}
              </g>
            );
          })}
        </g>

        {/* simulator bays */}
        <g {...hover("sim")} className="cursor-default">
          {Array.from({ length: bayCount }).map((_, i) => {
            const x = i * bayW;
            return (
              <g key={i}>
                <polygon points={quad(x, 30, bayW, 14)} fill={FILL} stroke={LINE} strokeWidth="1" />
                <path d={seg(x + 1, 30.6, x + bayW - 1, 30.6)} stroke={LINE_STRONG} strokeWidth="1.4" />
              </g>
            );
          })}
        </g>

        {/* classroom */}
        <g {...hover("classroom")} className="cursor-default">
          <polygon points={quad(26, 30, 18, 14)} fill={FILL} stroke={LINE} strokeWidth="1" />
          {Array.from({ length: seats }).map((_, i) => {
            const cols = 4;
            const rows = Math.ceil(seats / cols);
            const x = 27.5 + (i % cols) * (15 / cols);
            const y = 33 + Math.floor(i / cols) * (9 / rows);
            const [px, py] = iso(x, y);
            return <circle key={i} cx={px} cy={py} r="1.4" fill={LINE_STRONG} />;
          })}
          <path d={seg(27, 30.6, 43, 30.6)} stroke={LINE_STRONG} strokeWidth="1" />
        </g>

        {/* lounge */}
        <g {...hover("lounge")} className="cursor-default">
          <polygon points={quad(46, 30, 30, 20)} fill={FILL} stroke={LINE} strokeWidth="1" />
          <polygon points={quad(50, 36, 10, 3)} fill="none" stroke={LINE} strokeWidth="1" />
          <polygon points={quad(50, 42, 10, 3)} fill="none" stroke={LINE} strokeWidth="1" />
          <polygon points={quad(63, 36, 3, 9)} fill="none" stroke={LINE} strokeWidth="1" />
          <polygon points={quad(69, 34, 5, 12)} fill="none" stroke={LINE} strokeWidth="1" />
          <path d={seg(46, 30, 76, 30)} stroke={LINE_STRONG} strokeWidth="1.4" />
        </g>

        {/* lockers */}
        <g {...hover("lockers")} className="cursor-default">
          <polygon points={quad(78, 30, 20, 9)} fill={FILL} stroke={LINE} strokeWidth="1" />
          {Array.from({ length: 5 }).map((_, i) => (
            <path key={i} d={seg(78 + (i + 1) * (20 / 6), 30, 78 + (i + 1) * (20 / 6), 33)} stroke={LINE} strokeWidth="1" />
          ))}
          <path d={seg(78, 33, 98, 33)} stroke={LINE} strokeWidth="1" />
        </g>

        {/* desk */}
        <g {...hover("desk")} className="cursor-default">
          <polygon points={quad(78, 41, 20, 9)} fill={FILL} stroke={LINE} strokeWidth="1" />
          <polygon points={quad(80, 43, 16, 2.5)} fill="none" stroke={LINE_STRONG} strokeWidth="1" />
        </g>

        {/* active outline: the one accent element */}
        {activeZone && (
          <polygon
            points={quad(activeZone.x, activeZone.y, activeZone.w, activeZone.h)}
            fill="rgba(201,165,90,0.07)"
            stroke={GOLD}
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="pointer-events-none"
          />
        )}

        {/* captions in eyebrow type */}
        {ZONES.map((z) => {
          const [px, py] = iso(z.cx, z.cy);
          return (
            <text
              key={z.key}
              x={px}
              y={py}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="600"
              letterSpacing="1.3"
              fill={active === z.key ? GOLD : "rgba(255,255,255,0.6)"}
              stroke={FILL}
              strokeWidth="5"
              paintOrder="stroke"
              strokeLinejoin="round"
              style={{ fontFamily: "var(--font-sans)", transition: "fill 200ms" }}
              className="pointer-events-none select-none"
            >
              {FLOOR_ZONE_LABELS[z.key].toUpperCase()}
            </text>
          );
        })}
      </svg>

      <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Zones on the floor plan">
        {ZONES.map((z) => (
          <li key={z.key}>
            <button
              type="button"
              aria-pressed={active === z.key}
              onMouseEnter={() => setActive(z.key)}
              onMouseLeave={() => setActive((cur) => (cur === z.key ? null : cur))}
              onFocus={() => setActive(z.key)}
              onBlur={() => setActive((cur) => (cur === z.key ? null : cur))}
              onClick={() => setActive((cur) => (cur === z.key ? null : z.key))}
              className={cn(
                "t-eyebrow rounded-pill px-3 py-2 ring-1 ring-inset transition-[color,box-shadow] duration-200",
                active === z.key ? "text-accent ring-accent/60" : "text-mist ring-white/10 hover:text-snow",
              )}
            >
              {FLOOR_ZONE_LABELS[z.key]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
