"use client";

import { useState } from "react";

/**
 * UX41: React 19 resets a `<form action={fn}>`'s uncontrolled fields to
 * their `defaultValue` as part of submission itself, before the action even
 * resolves -- so a failed submit wipes the whole form, not just the bad
 * field, regardless of what the action later returns. Remounting the form
 * (via this key) once a new action result actually arrives makes any
 * `defaultValue` sourced from that result (e.g. echoed-back field values)
 * take effect again, instead of being silently ignored by the
 * already-reset, already-mounted inputs.
 *
 * Uses React's blessed "adjust state during render" pattern (not an
 * effect), so the remount happens in the same commit as the new state.
 */
export function useActionStateResetKey<T>(state: T) {
  const [trackedState, setTrackedState] = useState(state);
  const [resetKey, setResetKey] = useState(0);

  if (trackedState !== state) {
    setTrackedState(state);
    setResetKey((key) => key + 1);
  }

  return resetKey;
}
