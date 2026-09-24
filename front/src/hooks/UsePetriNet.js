import { useCallback, useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000/api";

// ---------------------------------------------------------------------------
// Réglages de la simulation
// ---------------------------------------------------------------------------
const TICK_MS = 50;
const MAX_QUEUE = 8;

const DEFAULT_CAPACITY = 5;
const DEFAULT_ARRIVAL_MS = 4000;

const DEFAULT_DURATIONS = {
  1: 800,   // T2
  2: 1200,  // T3
  3: 5000,  // T4
  4: 800,   // T5
};

const JITTER = { 0: 0.4, 1: 0.2, 2: 0.2, 3: 0.4, 4: 0.2 };

// Paliers d'avance rapide : (>) avance d'un palier, (>>) en saute deux
const SPEED_LEVELS = [1, 2, 4, 8, 16];
const DEFAULT_SPEED = 1;

// Clé de sauvegarde locale des réglages de temporisation
const STORAGE_KEY = "petri-parking-timings-v1";

const jitter = (ms, j) => Math.max(50, ms * (1 + (Math.random() * 2 - 1) * j));

function loadSavedTimings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.arrivalMs !== "number" ||
      typeof parsed.durations !== "object" ||
      typeof parsed.speed !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistTimings(arrivalMs, durations, speed) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ arrivalMs, durations, speed })
    );
  } catch {
    // stockage indisponible (navigation privée, quota…) : on ignore
  }
}

function clearSavedTimings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function usePetriNet() {
  const saved = loadSavedTimings();

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [arrivalMs, setArrivalMs] = useState(saved?.arrivalMs ?? DEFAULT_ARRIVAL_MS);
  const [durations, setDurations] = useState(saved?.durations ?? DEFAULT_DURATIONS);
  const [speed, setSpeed] = useState(saved?.speed ?? DEFAULT_SPEED);

  const setDuration = useCallback(
    (index, ms) => setDurations((d) => ({ ...d, [index]: ms })),
    []
  );

  // Avance rapide : (>) = palier suivant, (>>) = saut de deux paliers
  const speedForward = useCallback((steps = 1) => {
    setSpeed((current) => {
      const idx = SPEED_LEVELS.indexOf(current);
      const nextIdx = ((idx < 0 ? 0 : idx) + steps) % SPEED_LEVELS.length;
      return SPEED_LEVELS[nextIdx];
    });
  }, []);

  // Refs lues par le planificateur (évite de le relancer à chaque changement)
  const stateRef = useRef(null);
  const busyRef = useRef(false);
  const arrivalRef = useRef(arrivalMs);
  const durationsRef = useRef(durations);
  const speedRef = useRef(speed);

  useEffect(() => {
    arrivalRef.current = arrivalMs;
    durationsRef.current = durations;
    speedRef.current = speed;
    persistTimings(arrivalMs, durations, speed);
  }, [arrivalMs, durations, speed]);

  const fetchState = useCallback(async () => {
    try {
      const r = await fetch(`${API}/state`);
      const data = await r.json();
      stateRef.current = data;
      setState(data);
    } catch (e) {
      console.error("Erreur fetch state:", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/state`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        stateRef.current = data;
        setState(data);
      })
      .catch((e) => console.error("Erreur fetch state:", e));
    return () => {
      cancelled = true;
    };
  }, []);

  const fire = useCallback(
    async (index) => {
      setLoading(true);
      try {
        await fetch(`${API}/fire`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transition: index }),
        });
        await fetchState();
      } finally {
        setLoading(false);
      }
    },
    [fetchState]
  );

  // Réinitialise uniquement les temporisations (arrivées, durées, vitesse),
  // sans toucher au marquage ni à la capacité du réseau.
  const resetTimings = useCallback(() => {
    setArrivalMs(DEFAULT_ARRIVAL_MS);
    setDurations(DEFAULT_DURATIONS);
    setSpeed(DEFAULT_SPEED);
    clearSavedTimings();
  }, []);

  // Réinitialisation complète : simulation arrêtée, capacité, vitesses, durées,
  // marquage M0 et journal reviennent à leurs valeurs par défaut.
  const reset = useCallback(async () => {
    setAutoRun(false);
    resetTimings();

    while (busyRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    try {
      await fetch(`${API}/capacity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: DEFAULT_CAPACITY }),
      });
      await fetchState();
    } catch (e) {
      console.error("Erreur reset:", e);
    }
  }, [fetchState, resetTimings]);

  const setCapacity = useCallback(
    async (n) => {
      setAutoRun(false);
      await fetch(`${API}/capacity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: n }),
      });
      fetchState();
    },
    [fetchState]
  );

  // -------------------------------------------------------------------------
  // Simulation automatique — les délais sont divisés par speedRef.current
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!autoRun) return;

    let simNow = 0;
    let last = performance.now();
    const due = {};
    const parked = [];

    // plus de division par la vitesse ici
    const delay = (i) =>
    jitter(i === 0 ? arrivalRef.current : durationsRef.current[i], JITTER[i]);

    const id = setInterval(() => {
      // l'horloge avance même pendant un fire en cours
      const t = performance.now();
      simNow += (t - last) * speedRef.current;
      last = t;

      const s = stateRef.current;
      if (!s || busyRef.current) return;
      const now = simNow;

      const nParked = s.marking[2];
      while (parked.length < nParked) parked.push(now + delay(3));
      parked.sort((a, b) => a - b);
      parked.length = nParked;

      let next = -1;
      let nextAt = Infinity;

      for (let i = 0; i < 5; i++) {
        let at;
        if (i === 3) {
          at = s.enabled[3] && parked.length > 0 ? parked[0] : undefined;
        } else {
          const ok = i === 0 ? s.marking[0] < MAX_QUEUE : s.enabled[i];
          if (!ok) {
            delete due[i];
            continue;
          }
          due[i] ??= now + delay(i);
          at = due[i];
        }
        if (at !== undefined && at <= now && at < nextAt) {
          next = i;
          nextAt = at;
        }
      }

      if (next < 0) return;

      if (next === 3) parked.shift();
      else delete due[next];

      busyRef.current = true;
      fire(next)
        .catch(console.error)
        .finally(() => {
          busyRef.current = false;
        });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [autoRun, fire]);

  return {
    state,
    loading,
    autoRun,
    setAutoRun,
    arrivalMs,
    setArrivalMs,
    durations,
    setDuration,
    speed,
    speedLevels: SPEED_LEVELS,
    speedForward,
    fire,
    reset,
    resetTimings,
    setCapacity,
  };
}