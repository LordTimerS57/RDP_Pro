import { ScrollText } from "lucide-react";

export default function EventLog({ state, bare = false }) {
  if (!state) return null;
  const { history } = state;
  const reversed = [...history].reverse();

  return (
    <div className={bare ? "" : "card p-5"}>
      {!bare && (
        <h2 className="card-title mb-4">
          <ScrollText className="w-4 h-4 text-emerald-500" />
          Journal des événements
        </h2>
      )}
      <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
        {reversed.map((h, i) => (
          <div
            key={history.length - 1 - i}
            className={`flex items-start gap-2 p-2 rounded-lg border ${
              h.success === false
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <span className="text-slate-400 w-7 shrink-0">#{h.step}</span>
            <span className="flex-1 break-words">{h.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}