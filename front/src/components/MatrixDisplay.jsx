import { useState } from "react";
import { Grid3x3 } from "lucide-react";

const MATRIX_LABELS = {
  Pre: "Pré-incidence (Pre)",
  Post: "Post-incidence (Post)",
  W: "Incidence (W = Post − Pre)",
};

const PLACES = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"];
const TRANS = ["T1", "T2", "T3", "T4", "T5"];

function Matrix({ title, data }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">
        {title}
      </p>
      <div className="overflow-x-auto">
        <table className="text-[10px] font-mono border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-slate-500"></th>
              {TRANS.map((t) => (
                <th key={t} className="p-1 text-indigo-400 font-bold">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="p-1 text-violet-400 font-bold pr-2">{PLACES[i]}</td>
                {row.map((v, j) => (
                  <td
                    key={j}
                    className={`p-1 text-center border border-slate-700/50 w-7 ${
                      v > 0
                        ? "bg-emerald-500/20 text-emerald-300"
                        : v < 0
                        ? "bg-rose-500/20 text-rose-300"
                        : "text-slate-600"
                    }`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MatrixDisplay({ state }) {
  const [open, setOpen] = useState(false);
  if (!state) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-violet-400" />
          Matrices du réseau (NumPy)
        </h2>
        <span className="text-xs text-slate-400">{open ? "▼" : "▶"}</span>
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Matrix title={MATRIX_LABELS.Pre} data={state.matrices.Pre} />
          <Matrix title={MATRIX_LABELS.Post} data={state.matrices.Post} />
          <Matrix title={MATRIX_LABELS.W} data={state.matrices.W} />
        </div>
      )}
    </div>
  );
}