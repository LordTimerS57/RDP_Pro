import { Grid3x3 } from "lucide-react";

const MATRIX_LABELS = {
  Pre: "Pré-incidence (Pre)",
  Post: "Post-incidence (Post)",
  W: "Incidence (W = Post − Pre)",
};

const PLACES = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"];
const TRANS = ["T1", "T2", "T3", "T4", "T5"];

function Matrix({ title, data }) {
  return (
    <div>
      <p className="label-eyebrow mb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="text-[10px] font-mono border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-slate-300"></th>
              {TRANS.map((t) => (
                <th key={t} className="p-1 text-accent font-bold">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="p-1 text-accent-hover font-bold pr-2">{PLACES[i]}</td>
                {row.map((v, j) => (
                  <td
                    key={j}
                    className={`p-1 text-center border border-slate-200 w-7 rounded-sm ${
                      v > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : v < 0
                        ? "bg-rose-50 text-rose-700"
                        : "text-slate-300"
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

export default function MatrixDisplay({ state, bare = false }) {
  if (!state) return null;

  return (
    <div className={bare ? "space-y-5" : "card p-5"}>
      {!bare && (
        <h2 className="card-title mb-4">
          <Grid3x3 className="w-4 h-4 text-accent-hover" />
          Matrices du réseau (NumPy)
        </h2>
      )}
      <div className={bare ? "space-y-5" : "grid grid-cols-1 md:grid-cols-3 gap-5"}>
        <Matrix title={MATRIX_LABELS.Pre} data={state.matrices.Pre} />
        <Matrix title={MATRIX_LABELS.Post} data={state.matrices.Post} />
        <Matrix title={MATRIX_LABELS.W} data={state.matrices.W} />
      </div>
    </div>
  );
}