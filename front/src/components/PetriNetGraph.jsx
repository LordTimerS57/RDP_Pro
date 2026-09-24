// ============================================================================
// Canvas
// ============================================================================
const CANVAS_W = 2320;
const CANVAS_H = 1080;

// ============================================================================
// Coordonnées (mise à l'échelle uniforme, même disposition relative)
// ============================================================================
const PLACE_POS = {
  P5:  { x: 587,  y: 186 },
  P6:  { x: 958,  y: 186 },
  P10: { x: 1329, y: 186 },
  P8:  { x: 1824, y: 186 },
  P7:  { x: 2133, y: 186 },

  P1:  { x: 340,  y: 587 },
  P2:  { x: 773,  y: 587 },
  P3:  { x: 1391, y: 587 },
  P4:  { x: 1824, y: 587 },

  P9:  { x: 773,  y: 958 },
};

const TRANS_POS = {
  T1: { x: 93,   y: 587 },
  T2: { x: 556,  y: 587 },
  T3: { x: 1082, y: 587 },
  T4: { x: 1607, y: 587 },
  T5: { x: 2009, y: 587 },
};

const PLACE_R = 50;
const TOKEN_DISPLAY_MAX = 10; // à partir de 10 jetons : on affiche le nombre au lieu des points
const TRANS_W = 100;
const TRANS_H = 50;

// ============================================================================
// Arcs (avec P10)
// ============================================================================
const ARCS = [
  { from: { type: "trans", id: "T1" }, to: { type: "place", id: "P1" } },

  { from: { type: "place", id: "P1" },  to: { type: "trans", id: "T2" } },
  { from: { type: "place", id: "P5" },  to: { type: "trans", id: "T2" } },
  { from: { type: "place", id: "P9" },  to: { type: "trans", id: "T2" } },
  { from: { type: "trans", id: "T2" },  to: { type: "place", id: "P2" } },
  { from: { type: "trans", id: "T2" },  to: { type: "place", id: "P6" } },
  { from: { type: "trans", id: "T2" },  to: { type: "place", id: "P10" } },

  { from: { type: "place", id: "P2" },  to: { type: "trans", id: "T3" } },
  { from: { type: "place", id: "P6" },  to: { type: "trans", id: "T3" } },
  { from: { type: "place", id: "P10" }, to: { type: "trans", id: "T3" } },
  { from: { type: "trans", id: "T3" },  to: { type: "place", id: "P3" } },
  { from: { type: "trans", id: "T3" },  to: { type: "place", id: "P5" } },

  { from: { type: "place", id: "P3" },  to: { type: "trans", id: "T4" } },
  { from: { type: "place", id: "P7" },  to: { type: "trans", id: "T4" } },
  { from: { type: "trans", id: "T4" },  to: { type: "place", id: "P4" } },
  { from: { type: "trans", id: "T4" },  to: { type: "place", id: "P8" } },
  { from: { type: "trans", id: "T4" },  to: { type: "place", id: "P9" } },

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

  let sx, sy;
  if (from.kind === "place") {
    sx = from.x + ux * from.r;
    sy = from.y + uy * from.r;
  } else {
    const rr = Math.max(from.w, from.h) / 2;
    sx = from.x + ux * rr;
    sy = from.y + uy * rr;
  }

  let ex, ey;
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
// Palette (bleu + bleu-vert foncé pour la réservation + indigo pour les jetons)
// ============================================================================
const COLOR_ACCENT = "#2563eb";        // bleu (place active)
const COLOR_ACCENT_DARK = "#1e3a8a";   // bleu foncé (ressource, hover)
const COLOR_ACCENT_SOFT = "#eff6ff";   // bleu très clair (fond des places actives)
const COLOR_RESERVE = "#0f766e";       // bleu-vert foncé (réservation)
const COLOR_RESERVE_SOFT = "#f0fdfa";  // bleu-vert très clair (fond de P10 marquée)
const COLOR_TOKEN = "#4338ca";         // indigo (jetons)
const COLOR_TOKEN_DARK = "#312e81";    // indigo foncé (contour des jetons)
const COLOR_NEUTRAL = "#94a3b8";       // gris neutre (places/arcs inactifs)

// ============================================================================
// Composants SVG
// ============================================================================
function PlaceNode({ id, x, y, tokens, label, accent }) {
  const strokeColor =
    accent === "reservation" ? COLOR_RESERVE :
    accent === "resource"    ? COLOR_ACCENT_DARK :
    tokens > 0               ? COLOR_ACCENT :
                               COLOR_NEUTRAL;

  const haloColor =
    accent === "reservation" ? COLOR_RESERVE :
    accent === "resource"    ? COLOR_ACCENT_DARK :
                               COLOR_ACCENT;

  const fillColor =
    tokens > 0
      ? (accent === "reservation" ? COLOR_RESERVE_SOFT : COLOR_ACCENT_SOFT)
      : "#ffffff";

  return (
    <g transform={`translate(${x}, ${y})`}>
      {tokens > 0 && (
        <circle r={PLACE_R + 9} fill="none" stroke={haloColor} strokeWidth="2.5" opacity="0.5">
          <animate
            attributeName="r"
            values={`${PLACE_R + 7};${PLACE_R + 16};${PLACE_R + 7}`}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      <circle
        r={PLACE_R}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={tokens > 0 ? 4.5 : 3}
      />

      <text
        y={-PLACE_R - 18}
        textAnchor="middle"
        fill={strokeColor}
        fontSize="24"
        fontWeight="800"
        fontFamily="JetBrains Mono, monospace"
      >
        {id}
      </text>

      <text
        y={PLACE_R + 31}
        textAnchor="middle"
        fill="#334155"
        fontSize="17"
        fontWeight="700"
        fontFamily="Manrope, Inter, sans-serif"
      >
        {label}
      </text>

      {tokens > 0 && tokens < TOKEN_DISPLAY_MAX &&
        Array.from({ length: tokens }).map((_, i) => {
          const cols = tokens <= 4 ? tokens : 3;
          const rows = Math.ceil(tokens / cols);
          const col = i % cols;
          const row = Math.floor(i / cols);
          const spacing = 21;
          const ox = (col - (cols - 1) / 2) * spacing;
          const oy = (row - (rows - 1) / 2) * spacing;
          return (
            <circle
              key={i}
              cx={ox}
              cy={oy}
              r={6}
              fill={COLOR_TOKEN}
              stroke={COLOR_TOKEN_DARK}
              strokeWidth="0.75"
            />
          );
        })}

      {tokens >= TOKEN_DISPLAY_MAX && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill={COLOR_TOKEN}
          fontSize="30"
          fontWeight="800"
          fontFamily="JetBrains Mono, monospace"
        >
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
        rx={7}
        fill={enabled ? "#d1fae5" : "#f1f5f9"}
        stroke={enabled ? "#10b981" : "#94a3b8"}
        strokeWidth={enabled ? 4 : 3}
        className="transition-all duration-300"
      />
      <text
        y={8}
        textAnchor="middle"
        fill={enabled ? "#047857" : "#334155"}
        fontSize="24"
        fontWeight="800"
        fontFamily="JetBrains Mono, monospace"
      >
        {id}
      </text>
      <text
        y={TRANS_H / 2 + 26}
        textAnchor="middle"
        fill="#334155"
        fontSize="17"
        fontWeight="700"
        fontFamily="Manrope, Inter, sans-serif"
      >
        {label}
      </text>
      {enabled && (
        <circle cx={TRANS_W / 2 + 11} cy={-TRANS_H / 2 + 7} r={4.5} fill="#10b981">
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

  let color = COLOR_NEUTRAL;
  if (from.type === "place" && from.id === "P9")   color = COLOR_ACCENT_DARK;
  if (from.type === "trans" && to.id === "P9")     color = COLOR_ACCENT_DARK;
  if (from.type === "trans" && to.id === "P10")    color = COLOR_RESERVE;
  if (from.type === "place" && from.id === "P10")  color = COLOR_RESERVE;

  const dx = ex - sx;
  const dy = ey - sy;
  const isStraight = Math.abs(dy) < 5 || Math.abs(dx) < 5;

  if (isStraight) {
    return (
      <line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={color}
        strokeWidth={color === COLOR_NEUTRAL ? 2.4 : 3.4}
        markerEnd="url(#arrowhead)"
        opacity="0.85"
      />
    );
  }

  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const len = Math.hypot(dx, dy) || 1;
  const curvature = 22;
  const cx = mx - (dy / len) * curvature;
  const cy = my + (dx / len) * curvature;

  return (
    <path
      d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
      fill="none"
      stroke={color}
      strokeWidth={color === COLOR_NEUTRAL ? 2.4 : 3.4}
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
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
        <h2 className="card-title text-base">
          <span className="w-2 h-2 rounded-full bg-accent"></span>
          Réseau de Pétri — Vue graphe
        </h2>
        <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border-2 border-accent bg-white"></span>
            Place active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border-2 border-accent-hover bg-white"></span>
            Ressource (P9)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border-2 border-reserve bg-white"></span>
            Réservation (P10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-token border border-token-dark"></span>
            Jeton
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-emerald-200 border border-emerald-500"></span>
            T franchissable
          </span>
        </div>
      </div>

      <div className="overflow-auto rounded-xl bg-slate-50 border border-slate-200">
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="w-full h-auto"
          style={{ minHeight: "900px" }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="14" markerHeight="10" refX="13" refY="5" orient="auto">
              <polygon points="0 0, 14 5, 0 10" fill="#64748b" />
            </marker>
          </defs>

          <g>
            {ARCS.map((arc, i) => (
              <Arc key={i} from={arc.from} to={arc.to} />
            ))}
          </g>

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

      <div className="mt-4 px-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm font-mono">
        {placeOrder.map((pid, idx) => (
          <div
            key={pid}
            className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200"
          >
            <span
              className={`font-bold w-9 ${
                pid === "P9" ? "text-accent-hover" :
                pid === "P10" ? "text-reserve" :
                "text-accent"
              }`}
            >
              {pid}
            </span>
            <span className="text-slate-500 truncate flex-1">
              {SHORT_PLACE[place_labels[pid]]}
            </span>
            <span className="text-token font-bold">{marking[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}