import { ScrollText } from "lucide-react";

export default function EventLog({ state }) {
  if (!state) return null;
  const { history } = state;
  const reversed = [...history].reverse();

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-emerald-400" />
        Journal des événements
      </h2>
      <div className="max-h-72 overflow-y-auto space-y-1 pr-2 font-mono text-xs">
        {reversed.map((h, i) => (
          <div
            key={history.length - 1 - i}
            className={`flex items-start gap-2 p-2 rounded border ${
              h.success === false
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                : "bg-slate-900/40 border-slate-700/60 text-slate-300"
            }`}
          >
            <span className="text-slate-500 w-8 shrink-0">#{h.step}</span>
            <span className="flex-1 break-words">{h.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}