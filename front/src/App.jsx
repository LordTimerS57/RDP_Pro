import { usePetriNet } from "./hooks/usePetriNet";
import PetriNetGraph from "./components/PetriNetGraph";        // ⬅️ CHANGÉ
import ControlPanel from "./components/ControlPanel";
import EventLog from "./components/EventLog";
import MatrixDisplay from "./components/MatrixDisplay";
import { Network } from "lucide-react";

export default function App() {
  const {
    state,
    loading,
    autoRun,
    setAutoRun,
    speed,
    setSpeed,
    fire,
    reset,
    setCapacity,
  } = usePetriNet();

  return (
    <div className="min-h-screen p-6">
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Réseau de Pétri — Gestion de Parking
            </h1>
            <p className="text-sm text-slate-400">
              Simulation interactive · Moteur NumPy · 10 places (place de réservation compris) · 5 transitions
            </p>
          </div>
        </div>
      </header>

      {!state ? (
        <div className="max-w-7xl mx-auto text-center py-20 text-slate-400">
          ⏳ Connexion au backend (FastAPI sur :8000)...
        </div>
      ) : (
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PetriNetGraph state={state} />       {/* ⬅️ CHANGÉ */}
            <MatrixDisplay state={state} />
          </div>
          <div className="space-y-6">
            <ControlPanel
              state={state}
              autoRun={autoRun}
              setAutoRun={setAutoRun}
              speed={speed}
              setSpeed={setSpeed}
              fire={fire}
              reset={reset}
              setCapacity={setCapacity}
              loading={loading}
            />
            <EventLog state={state} />
          </div>
        </main>
      )}
    </div>
  );
}