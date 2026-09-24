import { Circle, Car, DoorOpen, DoorClosed, ParkingSquare } from "lucide-react";

const ICONS = {
  P1: Car,
  P2: Car,
  P3: ParkingSquare,
  P4: Car,
  P5: DoorClosed,
  P6: DoorOpen,
  P7: DoorClosed,
  P8: DoorOpen,
  P9: ParkingSquare,
};

const COLORS = {
  P1: "from-blue-500/20 to-blue-500/5 border-blue-500/40 text-blue-300",
  P2: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/40 text-cyan-300",
  P3: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/40 text-emerald-300",
  P4: "from-orange-500/20 to-orange-500/5 border-orange-500/40 text-orange-300",
  P5: "from-rose-500/20 to-rose-500/5 border-rose-500/40 text-rose-300",
  P6: "from-green-500/20 to-green-500/5 border-green-500/40 text-green-300",
  P7: "from-rose-500/20 to-rose-500/5 border-rose-500/40 text-rose-300",
  P8: "from-green-500/20 to-green-500/5 border-green-500/40 text-green-300",
  P9: "from-violet-500/20 to-violet-500/5 border-violet-500/40 text-violet-300",
};

export default function PetriNetViewer({ state }) {
  if (!state) return null;
  const { marking, place_labels } = state;

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Circle className="w-5 h-5 text-indigo-400" />
        Réseau de Pétri — Places
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {Object.keys(place_labels).map((pid, idx) => {
          const Icon = ICONS[pid];
          const tokens = marking[idx];
          const active = tokens > 0;
          return (
            <div
              key={pid}
              className={`relative bg-gradient-to-br ${COLORS[pid]} border rounded-xl p-3 transition-all ${
                active ? "shadow-lg shadow-current/20" : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold">{pid}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-[10px] leading-tight opacity-80 mb-2 h-8">
                {place_labels[pid]}
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">{tokens}</span>
                <span className="text-[10px] ml-1 opacity-60">jetons</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}