import React from "react";

// ============================================================================
// Canvas
// ============================================================================
const CANVAS_W = 1500;
const CANVAS_H = 700;

// ============================================================================
// Coordonnées optimisées (avec P10)
// ============================================================================
const PLACE_POS = {
  // --- Rangée haute (y=120) : barrières et réservation ---
  P5:  { x: 380,  y: 120 },   // Barrière entrée FERMÉE
  P6:  { x: 620,  y: 120 },   // Barrière entrée OUVERTE
  P10: { x: 860,  y: 120 },   // Réservation (au-dessus de T3)
  P8:  { x: 1180, y: 120 },   // Barrière sortie OUVERTE
  P7:  { x: 1380, y: 120 },   // Barrière sortie FERMÉE

  // --- Rangée centrale (y=380) : flux principal ---
  P1:  { x: 220,  y: 380 },
  P2:  { x: 500,  y: 380 },
  P3:  { x: 900,  y: 380 },
  P4:  { x: 1180, y: 380 },

  // --- Rangée basse (y=620) : ressource ---
  P9:  { x: 500,  y: 620 },   // Sous P2
};

const TRANS_POS = {
  T1: { x: 60,   y: 380 },
  T2: { x: 360,  y: 380 },
  T3: { x: 700,  y: 380 },
  T4: { x: 1040, y: 380 },
  T5: { x: 1300, y: 380 },
};

const PLACE_R = 32;
const TRANS_W = 64;
const TRANS_H = 32;

// ============================================================================
// Arcs (avec P10)
// ============================================================================
const ARCS = [
  // --- T1 : source externe → P1 ---
  { from: { type: "trans", id: "T1" }, to: { type: "place", id: "P1" } },

  // --- T2 : P1 + P5 + P9 → P2 + P6 + P10 ---
  { from: { type: "place", id: "P1" },  to: { type: "trans", id: "T2" } },
  { from: { type: "place", id: "P5" },  to: { type: "trans", id: "T2" } },
  { from: { type: "place", id: "P9" },  to: { type: "trans", id: "T2" } },   // ← ressource
  { from: { type: "trans", id: "T2" },  to: { type: "place", id: "P2" } },
  { from: { type: "trans", id: "T2" },  to: { type: "place", id: "P6" } },
  { from: { type: "trans", id: "T2" },  to: { type: "place", id: "P10" } },  // ← réservation

  // --- T3 : P2 + P6 + P10 → P3 + P5 ---
  { from: { type: "place", id: "P2" },  to: { type: "trans", id: "T3" } },
  { from: { type: "place", id: "P6" },  to: { type: "trans", id: "T3" } },
  { from: { type: "place", id: "P10" }, to: { type: "trans", id: "T3" } },   // ← réservation consommée
  { from: { type: "trans", id: "T3" },  to: { type: "place", id: "P3" } },
  { from: { type: "trans", id: "T3" },  to: { type: "place", id: "P5" } },

  // --- T4 : P3 + P7 → P4 + P8 + P9 ---
  { from: { type: "place", id: "P3" },  to: { type: "trans", id: "T4" } },
  { from: { type: "place", id: "P7" },  to: { type: "trans", id: "T4" } },
  { from: { type: "trans", id: "T4" },  to: { type: "place", id: "P4" } },
  { from: { type: "trans", id: "T4" },  to: { type: "place", id: "P8" } },
  { from: { type: "trans", id: "T4" },  to: { type: "place", id: "P9" } },   // ← ressource libérée

  // --- T5 : P4 + P8 → P7 ---
  { from: { type: "place", id: "P4" },  to: { type: "trans", id: "T5" } },
  { from: { type: "place", id: "P8" },  to: { type: "trans", id: "T5" } },
  { from: { type: "trans", id: "T5" },  to: { type: "place", id: "P7" } },
];

// ============================================================================
// Helpers géométriques
// ============================================================================
function nodeCenter(node) {
  if (node.type === "place") {
    const p = PLACE_POS[node.id];
    return { kind: "place", x: p.x, y: p.y, r: PLACE_R };
  }
  const t = TRANS_POS[node.id];
  return { kind: "trans", x: t.x, y: t.y, w: TRANS_W, h: TRANS_H };
}

function edgePoint(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  let sx = from.x, sy = from.y;
  if (from.kind === "place") {
    sx = from.x + ux * from.r;
    sy = from.y + uy * from.r;
  } else {
    const rr = Math.max(from.w, from.h) / 2;
    sx = from.x + ux * rr;
    sy = from.y + uy * rr;
  }

  let ex = to.x, ey = to.y;
  if (to.kind === "place") {
    ex = to.x - ux * to.r;
    ey = to.y - uy * to.r;
  } else {
    const rr = Math.max(to.w, to.h) / 2;
    ex = to.x - ux * rr;
    ey = to.y - uy * rr;
  }

  return { sx, sy, ex, ey };
}

// ============================================================================
// Composants SVG
// ============================================================================
function PlaceNode({ id, x, y, tokens, label, accent }) {
  const strokeColor =
    accent === "reservation" ? "#fbbf24" :
    accent === "resource"    ? "#a78bfa" :
    tokens > 0               ? "#818cf8" :
                               "#475569";

  const haloColor =
    accent === "reservation" ? "#fbbf24" :
    accent === "resource"    ? "#a78bfa" :
                               "#818cf8";

  return (
    <g transform={`translate(${x}, ${y})`}>
      {tokens > 0 && (
        <circle r={PLACE_R + 6} fill="none" stroke={haloColor} strokeWidth="2" opacity="0.5">
          <animate
            attributeName="r"
            values={`${PLACE_R + 4};${PLACE_R + 10};${PLACE_R + 4}`}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      <circle
        r={PLACE_R}
        fill={tokens > 0 ? "#1e293b" : "#0f172a"}
        stroke={strokeColor}
        strokeWidth={tokens > 0 ? 3 : 2}
      />

      <text
        y={-PLACE_R - 10}
        textAnchor="middle"
        fill={strokeColor}
        fontSize="13"
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
      >
        {id}
      </text>

      <text
        y={PLACE_R + 18}
        textAnchor="middle"
        fill="#64748b"
        fontSize="9"
        fontFamily="Inter, sans-serif"
      >
        {label}
      </text>

      {tokens > 0 &&
        Array.from({ length: Math.min(tokens, 9) }).map((_, i) => {
          const cols = tokens <= 4 ? tokens : 3;
          const rows = Math.ceil(tokens / cols);
          const col = i % cols;
          const row = Math.floor(i / cols);
          const spacing = 13;
          const ox = (col - (cols - 1) / 2) * spacing;
          const oy = (row - (rows - 1) / 2) * spacing;
          return (
            <circle
              key={i}
              cx={ox}
              cy={oy}
              r={3.5}
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="0.5"
            />
          );
        })}

      {tokens > 9 && (
        <text y={5} textAnchor="middle" fill="#facc15" fontSize="14" fontWeight="700">
          {tokens}
        </text>
      )}
    </g>
  );
}

function TransitionNode({ id, x, y, enabled, label }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-TRANS_W / 2}
        y={-TRANS_H / 2}
        width={TRANS_W}
        height={TRANS_H}
        rx={4}
        fill={enabled ? "#065f46" : "#1e293b"}
        stroke={enabled ? "#10b981" : "#475569"}
        strokeWidth={enabled ? 2.5 : 2}
        className="transition-all duration-300"
      />
      <text
        y={5}
        textAnchor="middle"
        fill={enabled ? "#a7f3d0" : "#94a3b8"}
        fontSize="13"
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
      >
        {id}
      </text>
      <text
        y={TRANS_H / 2 + 15}
        textAnchor="middle"
        fill="#64748b"
        fontSize="9"
        fontFamily="Inter, sans-serif"
      >
        {label}
      </text>
      {enabled && (
        <circle cx={TRANS_W / 2 + 8} cy={-TRANS_H / 2 + 4} r={3} fill="#10b981">
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function Arc({ from, to }) {
  const fc = nodeCenter(from);
  const tc = nodeCenter(to);
  const { sx, sy, ex, ey } = edgePoint(fc, tc);

  // Couleur selon la nature de l'arc
  let color = "#475569";
  if (from.type === "place" && from.id === "P9") color = "#a78bfa";   // ressource → transition
  if (from.type === "trans" && to.id === "P9")     color = "#a78bfa"; // transition → ressource
  if (from.type === "trans" && to.id === "P10")    color = "#fbbf24"; // réservation produite
  if (from.type === "place" && from.id === "P10")  color = "#fbbf24"; // réservation consommée

  const dx = ex - sx;
  const dy = ey - sy;
  const isStraight = Math.abs(dy) < 5 || Math.abs(dx) < 5;

  if (isStraight) {
    return (
      <line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={color}
        strokeWidth={color === "#475569" ? 1.5 : 2.2}
        markerEnd="url(#arrowhead)"
        opacity="0.85"
      />
    );
  }

  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const len = Math.hypot(dx, dy) || 1;
  const curvature = 15;
  const cx = mx - (dy / len) * curvature;
  const cy = my + (dx / len) * curvature;

  return (
    <path
      d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
      fill="none"
      stroke={color}
      strokeWidth={color === "#475569" ? 1.5 : 2.2}
      markerEnd="url(#arrowhead)"
      opacity="0.85"
    />
  );
}

// ============================================================================
// Labels courts
// ============================================================================
const SHORT_PLACE = {
  "Voiture en attente": "Attente",
  "Voiture entrante": "Entrante",
  "Voiture garée": "Garée",
  "Voiture sortante": "Sortante",
  "Barrière entrée FERMÉE": "B. entrée ▼",
  "Barrière entrée OUVERTE": "B. entrée ▲",
  "Barrière sortie FERMÉE": "B. sortie ▼",
  "Barrière sortie OUVERTE": "B. sortie ▲",
  "Places disponibles": "Places libres",
  "Réservation": "Réservée",
};

const SHORT_TRANS = {
  "Arrivée voiture (P1)": "Arrivée",
  "Ouverture barrière + réservation": "Réserver",
  "Entrée véhicule (garage)": "Stationner",
  "Sortie véhicule": "Sortir",
  "Fermeture / réarmement barrières": "Réarmer",
};

// ============================================================================
// Composant principal
// ============================================================================
export default function PetriNetGraph({ state }) {
  if (!state) return null;

  const { marking, place_labels, transition_labels, enabled } = state;
  const placeOrder = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"];

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          Réseau de Pétri — Vue graphe (avec P10)
        </h2>
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border-2 border-indigo-400 bg-slate-800"></span>
            Place active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border-2 border-violet-400 bg-slate-800"></span>
            Ressource (P9)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border-2 border-yellow-400 bg-slate-800"></span>
            Réservation (P10)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-700 border border-emerald-500"></span>
            T franchissable
          </span>
        </div>
      </div>

      <div className="overflow-auto">
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="w-full h-auto"
          style={{ minHeight: "520px" }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Arcs */}
          <g>
            {ARCS.map((arc, i) => (
              <Arc key={i} from={arc.from} to={arc.to} />
            ))}
          </g>

          {/* Transitions */}
          <g>
            {Object.keys(TRANS_POS).map((tid, idx) => (
              <TransitionNode
                key={tid}
                id={tid}
                x={TRANS_POS[tid].x}
                y={TRANS_POS[tid].y}
                enabled={enabled[idx]}
                label={SHORT_TRANS[transition_labels[tid]] || ""}
              />
            ))}
          </g>

          {/* Places */}
          <g>
            {placeOrder.map((pid) => {
              const accent =
                pid === "P9" ? "resource" :
                pid === "P10" ? "reservation" :
                undefined;
              return (
                <PlaceNode
                  key={pid}
                  id={pid}
                  x={PLACE_POS[pid].x}
                  y={PLACE_POS[pid].y}
                  tokens={marking[placeOrder.indexOf(pid)]}
                  label={SHORT_PLACE[place_labels[pid]] || ""}
                  accent={accent}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Légende textuelle des places */}
      <div className="mt-3 px-2 grid grid-cols-3 md:grid-cols-5 gap-2 text-[11px] font-mono">
        {placeOrder.map((pid, idx) => (
          <div
            key={pid}
            className="flex items-center gap-2 bg-slate-900/40 rounded px-2 py-1 border border-slate-700/50"
          >
            <span
              className={`font-bold w-8 ${
                pid === "P9" ? "text-violet-400" :
                pid === "P10" ? "text-yellow-400" :
                "text-indigo-400"
              }`}
            >
              {pid}
            </span>
            <span className="text-slate-400 truncate flex-1">
              {SHORT_PLACE[place_labels[pid]]}
            </span>
            <span className="text-yellow-300 font-bold">{marking[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}