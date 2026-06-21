import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WalkthroughState {
  loading: boolean;
  authed: boolean;
  // General sidebar tour (9 steps, completed = step 10)
  completed: boolean;
  step: number;
  // Ambience tool tour (5 steps, completed = step 6)
  ambienceCompleted: boolean;
  ambienceStep: number;
  onboardingDone: boolean;
}

const listeners = new Set<(s: WalkthroughState) => void>();
let current: WalkthroughState = {
  loading: true,
  authed: false,
  completed: false,
  step: 0,
  ambienceCompleted: false,
  ambienceStep: 0,
  onboardingDone: false,
};

function setState(next: Partial<WalkthroughState>) {
  current = { ...current, ...next };
  listeners.forEach((l) => l(current));
}

async function load() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setState({
      loading: false,
      authed: false,
      completed: false,
      step: 0,
      ambienceCompleted: false,
      ambienceStep: 0,
      onboardingDone: false,
    });
    return;
  }
  const { data } = await supabase
    .from("profiles")
    .select("walkthrough_completed, walkthrough_step, ambience_walkthrough_completed, ambience_walkthrough_step, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();
  const onboardingDone = !!data?.onboarding_completed;
  setState({
    loading: false,
    authed: true,
    // Treat as completed (suppress tour) when onboarding form hasn't been done yet.
    completed: !!data?.walkthrough_completed || !onboardingDone,
    step: data?.walkthrough_step ?? 0,
    ambienceCompleted: !!(data as any)?.ambience_walkthrough_completed || !onboardingDone,
    ambienceStep: (data as any)?.ambience_walkthrough_step ?? 0,
    onboardingDone,
  });
}

let initialized = false;
function ensureInit() {
  if (initialized) return;
  initialized = true;
  load();
  supabase.auth.onAuthStateChange(() => {
    // Defer to avoid deadlock with supabase listener
    setTimeout(load, 0);
  });
}

export function useWalkthrough() {
  const [s, setS] = useState<WalkthroughState>(current);
  useEffect(() => {
    ensureInit();
    listeners.add(setS);
    setS(current);
    return () => {
      listeners.delete(setS);
    };
  }, []);

  const setStep = useCallback(async (step: number) => {
    setState({ step });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ walkthrough_step: step }).eq("id", user.id);
  }, []);

  const complete = useCallback(async () => {
    setState({ completed: true, step: 10 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ walkthrough_completed: true, walkthrough_step: 10 })
      .eq("id", user.id);
  }, []);

  const setAmbienceStep = useCallback(async (step: number) => {
    setState({ ambienceStep: step });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({ ambience_walkthrough_step: step } as any).eq("id", user.id);
  }, []);

  const completeAmbience = useCallback(async () => {
    setState({ ambienceCompleted: true, ambienceStep: 6 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ ambience_walkthrough_completed: true, ambience_walkthrough_step: 6 } as any)
      .eq("id", user.id);
  }, []);

  const refresh = useCallback(() => load(), []);

  const restart = useCallback(async () => {
    setState({ completed: false, step: 1, ambienceCompleted: false, ambienceStep: 0 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({
        walkthrough_completed: false,
        walkthrough_step: 1,
        ambience_walkthrough_completed: false,
        ambience_walkthrough_step: 0,
      } as any)
      .eq("id", user.id);
  }, []);

  return { ...s, setStep, complete, setAmbienceStep, completeAmbience, refresh, restart };
}

/** True when EITHER walkthrough must still be completed before generation is allowed. */
export function useGenerationBlocked() {
  const { loading, authed, completed, ambienceCompleted } = useWalkthrough();
  return !loading && authed && (!completed || !ambienceCompleted);
}