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
  bare = false,
}) {
  if (!state) return null;

  const { enabled, transition_labels, capacity } = state;

  return (
    <div className={bare ? "space-y-5" : "card p-5 space-y-5"}>
      {!bare && (
        <h2 className="card-title">
          <Zap className="w-4 h-4 text-amber-500" />
          Panneau de contrôle
        </h2>
      )}

      <div>
        <p className="label-eyebrow mb-2">Transitions manuelles</p>
        <div className="grid grid-cols-1 gap-1.5">
          {TRANSITION_ORDER.map((tid, i) => {
            const ok = enabled[i];
            return (
              <button
                key={tid}
                onClick={() => fire(i)}
                disabled={!ok || loading}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                  ok
                    ? "bg-white border-slate-200 hover:bg-accent-hover hover:border-accent-hover"
                    : "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                }`}
              >
                <span
                  className={`font-mono font-bold text-[13px] w-8 ${
                    ok ? "text-slate-700 group-hover:text-white" : "text-slate-400"
                  }`}
                >
                  {tid}
                </span>
                <span
                  className={`text-[13px] flex-1 truncate ${
                    ok ? "text-slate-600 group-hover:text-white" : "text-slate-400"
                  }`}
                >
                  {transition_labels[tid]}
                </span>
                <ArrowRightCircle
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    ok
                      ? "text-accent group-hover:text-white group-hover:translate-x-0.5"
                      : "text-slate-300"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="label-eyebrow mb-2">Simulation automatique</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRun(!autoRun)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              autoRun
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {autoRun ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRun ? "Stop" : "Démarrer"}
          </button>
          <div className="flex-1">
            <label className="text-[11px] text-slate-400">
              Vitesse : {speed} ms
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-accent-hover"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 space-y-3">
        <div>
          <label className="label-eyebrow flex items-center gap-1.5 mb-2">
            <Settings className="w-3 h-3" />
            Capacité du parking : {capacity} places
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full accent-brown"
          />
        </div>
        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-accent-hover hover:text-white text-slate-700 text-sm font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser (M0)
        </button>
      </div>
    </div>
  );
}