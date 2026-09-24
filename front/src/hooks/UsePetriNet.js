import { useCallback, useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000/api";

// ---------------------------------------------------------------------------
// Réglages de la simulation (à ajuster selon le réalisme voulu)
// ---------------------------------------------------------------------------
const TICK_MS = 100;          // fréquence de vérification du planificateur
const MAX_QUEUE = 8;          // file d'attente max à l'entrée (au-delà, la voiture repart)

const DEFAULT_CAPACITY = 5;      // capacité du parking (identique au back)
const DEFAULT_ARRIVAL_MS = 4000; // délai moyen entre deux arrivées (T1)

// Durée de chaque transition en ms, indexée par numéro de transition (0 = T1)
const DEFAULT_DURATIONS = {
  1: 800,   // T2 : ouverture barrière + réservation
  2: 1200,  // T3 : entrée dans le garage
  3: 5000,  // T4 : durée de stationnement
  4: 800,   // T5 : réarmement barrière de sortie
};

// Variation aléatoire : durée finale = durée × (1 ± JITTER). 0 = parfaitement régulier.
const JITTER = { 0: 0.4, 1: 0.2, 2: 0.2, 3: 0.4, 4: 0.2 };

const jitter = (ms, j) => Math.max(50, ms * (1 + (Math.random() * 2 - 1) * j));

export function usePetriNet() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [arrivalMs, setArrivalMs] = useState(DEFAULT_ARRIVAL_MS);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);

  const setDuration = useCallback(
    (index, ms) => setDurations((d) => ({ ...d, [index]: ms })),
    []
  );

  // Refs lues par le planificateur (évite de le relancer à chaque changement)
  const stateRef = useRef(null);
  const busyRef = useRef(false);
  const arrivalRef = useRef(DEFAULT_ARRIVAL_MS);
  const durationsRef = useRef(DEFAULT_DURATIONS);

  useEffect(() => {
    arrivalRef.current = arrivalMs;
    durationsRef.current = durations;
  }, [arrivalMs, durations]);

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

  // Chargement initial : setState n'est appelé que dans le callback de la requête
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

  // Réinitialisation complète : simulation arrêtée, capacité, vitesses, durées,
  // marquage M0 et journal reviennent à leurs valeurs par défaut.
  const reset = useCallback(async () => {
    setAutoRun(false);
    setArrivalMs(DEFAULT_ARRIVAL_MS);
    setDurations(DEFAULT_DURATIONS);

    // Laisse se terminer un tir automatique éventuellement en cours
    while (busyRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    try {
      // /capacity remet aussi le marquage à M0 et vide le journal
      await fetch(`${API}/capacity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity: DEFAULT_CAPACITY }),
      });
      await fetchState();
    } catch (e) {
      console.error("Erreur reset:", e);
    }
  }, [fetchState]);

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
  // Simulation automatique (réseau temporisé)
  //  - T1 : arrivées aléatoires autour de l'intervalle moyen, redéfini à chaque voiture
  //  - T2, T3, T5 : durée réglable individuellement, dès que la transition est franchissable
  //  - T4 : chaque voiture garée a sa propre durée de stationnement (réglable)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!autoRun) return;

    const due = {};    // échéance de T1, T2, T3, T5
    const parked = []; // échéances de sortie, une par voiture garée (triées)

    const delay = (i) => {
      const base = i === 0 ? arrivalRef.current : durationsRef.current[i];
      return jitter(base, JITTER[i]);
    };

    const id = setInterval(() => {
      const s = stateRef.current;
      if (!s || busyRef.current) return;
      const now = Date.now();

      // Synchronise les échéances de T4 avec le nombre de voitures garées (P3)
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
    fire,
    reset,
    setCapacity,
  };
}