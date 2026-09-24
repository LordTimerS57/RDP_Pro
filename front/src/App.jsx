import { useState } from "react";
import { usePetriNet } from "./hooks/usePetriNet";
import PetriNetGraph from "./components/PetriNetGraph";
import ControlPanel from "./components/ControlPanel";
import EventLog from "./components/EventLog";
import MatrixDisplay from "./components/MatrixDisplay";
import { Network, SlidersHorizontal, Grid3x3, ScrollText } from "lucide-react";

const TABS = [
  { id: "control", label: "Contrôle", icon: SlidersHorizontal },
  { id: "matrices", label: "Matrices", icon: Grid3x3 },
  { id: "journal", label: "Journal", icon: ScrollText },
];

export default function App() {
  const {
    state,
    loading,
    autoRun,
    setAutoRun,
    arrivalMs,
    setArrivalMs,
    durations,
    setDuration,
    fire,
    reset,
    setCapacity,
  } = usePetriNet();

  const [tab, setTab] = useState("control");

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent-soft">
            <Network className="w-5 h-5 text-accent-hover" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
              Réseau de Pétri — Gestion de Parking
            </h1>
            <p className="text-xs text-slate-500">
              Simulation interactive · Moteur NumPy · 10 places · 5 transitions
            </p>
          </div>
        </div>
      </header>

      {!state ? (
        <div className="max-w-[1800px] mx-auto text-center py-24 text-slate-500 text-sm">
          Connexion au backend (FastAPI sur :8000)…
        </div>
      ) : (
        <main className="max-w-[1800px] mx-auto px-6 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-9">
              <PetriNetGraph state={state} />
            </div>

            <div className="xl:col-span-3 card p-2 xl:sticky xl:top-6">
              <div className="grid grid-cols-3 gap-1 mb-2">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      tab === id
                        ? "bg-accent-hover text-white"
                        : "text-slate-400 hover:bg-accent-soft hover:text-accent-hover"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-3 max-h-[calc(100vh-11rem)] overflow-y-auto">
                {tab === "control" && (
                  <ControlPanel
                    state={state}
                    autoRun={autoRun}
                    setAutoRun={setAutoRun}
                    arrivalMs={arrivalMs}
                    setArrivalMs={setArrivalMs}
                    durations={durations}
                    setDuration={setDuration}
                    fire={fire}
                    reset={reset}
                    setCapacity={setCapacity}
                    loading={loading}
                    bare
                  />
                )}
                {tab === "matrices" && <MatrixDisplay state={state} bare />}
                {tab === "journal" && <EventLog state={state} bare />}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}