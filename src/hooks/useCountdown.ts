import { useEffect, useState } from "react";

interface UseCountdownOptions {
  /** Total length of the countdown in seconds. */
  totalSeconds: number;
  /**
   * If set, the countdown end-time is persisted in sessionStorage under this
   * key so the timer survives navigation/reloads within the same session, but
   * resets to the full duration in a new session (perpetual urgency timer).
   */
  persistKey?: string;
}

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalRemaining: number;
  expired: boolean;
}

const compute = (endsAt: number): CountdownValue => {
  const totalRemaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
  return {
    days: Math.floor(totalRemaining / 86400),
    hours: Math.floor((totalRemaining % 86400) / 3600),
    minutes: Math.floor((totalRemaining % 3600) / 60),
    seconds: totalRemaining % 60,
    totalRemaining,
    expired: totalRemaining <= 0,
  };
};

/**
 * Perpetual countdown timer. Resets to the full duration each session.
 * Used for the pricing-page €1 urgency timer (3 days) and the upsell modal
 * timers (e.g. 10:00, 07:45).
 */
export function useCountdown({ totalSeconds, persistKey }: UseCountdownOptions): CountdownValue {
  const [endsAt] = useState<number>(() => {
    const now = Date.now();
    const fresh = now + totalSeconds * 1000;
    if (!persistKey || typeof window === "undefined") return fresh;

    const stored = window.sessionStorage.getItem(persistKey);
    if (stored) {
      const parsed = Number(stored);
      // Reuse a still-valid stored end-time; otherwise start a new cycle.
      if (Number.isFinite(parsed) && parsed > now) return parsed;
    }
    window.sessionStorage.setItem(persistKey, String(fresh));
    return fresh;
  });

  const [value, setValue] = useState<CountdownValue>(() => compute(endsAt));

  useEffect(() => {
    const tick = () => setValue(compute(endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return value;
}
