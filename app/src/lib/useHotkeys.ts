import { useEffect, useRef } from "react";

export type HotkeyMap = Partial<Record<string, () => void>>;

/**
 * Global keyboard shortcuts, keyed by KeyboardEvent.key (" " for Space).
 *
 * Ignored while typing in a field, and ignored when Space or Enter lands on a focused button: the
 * browser already clicks the button, and handling it here as well would act twice.
 */
export function useHotkeys(map: HotkeyMap): void {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (tag === "BUTTON" && (event.key === " " || event.key === "Enter")) return;
      const handler = ref.current[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
