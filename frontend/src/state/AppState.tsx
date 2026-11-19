// Shared state for all three views, mirrored to localStorage, with reset.
// Implements: PR-002 (reset to the seed), research.md R-4, A-17 (simulated clock), DP-3 (one
// state, so one acceptance updates the rider and the driver together).
// Views call the domain store; no decision logic lives here (constitution Principle V).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData, Minutes, Result } from '../domain/types';
import { createSeed, DISPATCHER_NAME } from '../domain/seed';
import { simulatedClock } from '../domain/clock';
import {
  acceptChange,
  cancelTrip,
  declineChange,
  submitTimeChange,
  type TransitionResult,
} from '../domain/store';

const STORAGE_KEY = 'same-day-changes:v1';

interface Persisted {
  data: AppData;
  originMs: number;
}

function load(): Persisted {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    // Storage unavailable or corrupt: start from the seed.
  }
  return { data: createSeed(), originMs: Date.now() };
}

function save(p: Persisted): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Persistence is a convenience only.
  }
}

interface AppState {
  data: AppData;
  now: Minutes;
  submitChange(tripId: string, newStart: Minutes): Result<TransitionResult>;
  cancel(tripId: string): Result<TransitionResult>;
  accept(requestId: string): Result<TransitionResult>;
  decline(requestId: string, reason: string): Result<TransitionResult>;
  reset(): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load);
  const [, setTick] = useState(0);

  useEffect(() => save(state), [state]);

  // Re-render periodically so the simulated clock display advances.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  const now = simulatedClock(state.originMs).now();

  const run = useCallback(
    (fn: (data: AppData, at: Minutes) => Result<TransitionResult>): Result<TransitionResult> => {
      const at = simulatedClock(state.originMs).now();
      const result = fn(state.data, at);
      if (result.ok) setState((s) => ({ ...s, data: result.value.data }));
      return result;
    },
    [state],
  );

  const value = useMemo<AppState>(
    () => ({
      data: state.data,
      now,
      submitChange: (tripId, newStart) => run((d, at) => submitTimeChange(d, tripId, newStart, at)),
      cancel: (tripId) => run((d, at) => cancelTrip(d, tripId, at)),
      accept: (requestId) => run((d, at) => acceptChange(d, requestId, DISPATCHER_NAME, at)),
      decline: (requestId, reason) =>
        run((d, at) => declineChange(d, requestId, DISPATCHER_NAME, reason, at)),
      reset: () => setState({ data: createSeed(), originMs: Date.now() }),
    }),
    [state, now, run],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
