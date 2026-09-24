import { useCallback, useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000/api";

export function usePetriNet() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [speed, setSpeed] = useState(800); // ms
  const timerRef = useRef(null);

  const fetchState = useCallback(async () => {
    try {
      const r = await fetch(`${API}/state`);
      setState(await r.json());
    } catch (e) {
      console.error("Erreur fetch state:", e);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

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

  const reset = useCallback(async () => {
    setAutoRun(false);
    await fetch(`${API}/reset`, { method: "POST" });
    fetchState();
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

  // Boucle de simulation automatique
  useEffect(() => {
    if (!autoRun || !state) return;
    const enabled = state.enabled
      .map((ok, i) => (ok ? i : -1))
      .filter((i) => i >= 0);

    if (enabled.length === 0) {
      setAutoRun(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      let choice = enabled[0];
      if (enabled.includes(0) && state.marking[0] === 0 && state.marking[2] === 0)
        choice = 0;
      else if (enabled.includes(1)) choice = 1;
      else if (enabled.includes(2)) choice = 2;
      else if (enabled.includes(3)) choice = 3;
      else if (enabled.includes(4)) choice = 4;

      fire(choice);
    }, speed);

    return () => clearTimeout(timerRef.current);
  }, [autoRun, state, speed, fire]);

  return {
    state,
    loading,
    autoRun,
    setAutoRun,
    speed,
    setSpeed,
    fire,
    reset,
    setCapacity,
  };
}