import { useEffect, useRef, useState } from "react";
import type { AppState } from "./profiles";
import { loadState, saveState } from "./storage";

/**
 * The persisted state, saved after every change. When saving fails the app carries on from memory
 * and `saveFailed` lets it tell the player their progress will not survive a reload.
 */
export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [saveFailed, setSaveFailed] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Nothing has changed on the first render; writing back what was just read is pointless.
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveFailed(!saveState(state));
  }, [state]);

  return { state, setState, saveFailed };
}
