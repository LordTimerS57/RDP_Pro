import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Settings,
  ArrowRightCircle,
} from "lucide-react";

const TRANSITION_ORDER = ["T1", "T2", "T3", "T4", "T5"];

export default function ControlPanel({
  state,
  autoRun,
  setAutoRun,
  speed,
  setSpeed,
  fire,
  reset,
  setCapacity,
  loading,
}) {
  if (!state) return null;

  const { enabled, transition_labels, capacity } = state;

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Panneau de contrôle
        </h2>
      </div>

      {/* Boutons transitions */}
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
          Transitions manuelles
        </p>
        <div className="grid grid-cols-1 gap-2">
          {TRANSITION_ORDER.map((tid, i) => {
            const ok = enabled[i];
            return (
              <button
                key={tid}
                onClick={() => fire(i)}
                disabled={!ok || loading}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                  ok
                    ? "bg-slate-700/50 border-slate-600 hover:bg-indigo-600/30 hover:border-indigo-500"
                    : "bg-slate-800/40 border-slate-700 opacity-40 cursor-not-allowed"
                }`}
              >
                <span className="font-mono font-bold text-sm w-8">{tid}</span>
                <span className="text-xs flex-1 truncate">
                  {transition_labels[tid]}
                </span>
                <ArrowRightCircle
                  className={`w-4 h-4 ${
                    ok ? "text-indigo-400 group-hover:translate-x-0.5" : "text-slate-600"
                  } transition-transform`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulation automatique */}
      <div className="border-t border-slate-700 pt-4">
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
          Simulation automatique
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRun(!autoRun)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              autoRun
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {autoRun ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRun ? "Stop" : "Démarrer"}
          </button>
          <div className="flex-1">
            <label className="text-[10px] text-slate-400">
              Vitesse : {speed} ms
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Capacité + Reset */}
      <div className="border-t border-slate-700 pt-4 space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <Settings className="w-3 h-3" />
            Capacité du parking : {capacity} places
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>
        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser (M0)
        </button>
      </div>
    </div>
  );
}