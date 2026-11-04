import { useContext, useEffect, useRef, useState } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";

// BrowserRouter is not a data router; keep this guard scoped to the OCR panel.
export function useOcrUnsavedChanges(dirty: boolean) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const pending = useRef<(() => void) | null>(null);
  const bypass = useRef(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const guard = (action: () => void) => {
      if (!dirtyRef.current || bypass.current) { action(); return; }
      pending.current = action;
      setOpen(true);
    };
    const push = navigator.push;
    const replace = navigator.replace;
    const go = navigator.go;
    navigator.push = (...args) => guard(() => push.apply(navigator, args));
    navigator.replace = (...args) => guard(() => replace.apply(navigator, args));
    navigator.go = (...args) => guard(() => go.apply(navigator, args));
    const capture = (event: MouseEvent) => {
      if (!dirtyRef.current || bypass.current || !(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("nav button, a[href]");
      if (!target || target.getAttribute("aria-current") === "page") return;
      event.preventDefault();
      event.stopPropagation();
      guard(() => { bypass.current = true; target.click(); bypass.current = false; });
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current || bypass.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("click", capture, true);
    window.addEventListener("beforeunload", unload);
    return () => {
      navigator.push = push;
      navigator.replace = replace;
      navigator.go = go;
      document.removeEventListener("click", capture, true);
      window.removeEventListener("beforeunload", unload);
    };
  }, [navigator]);
  return {
    open,
    keepEditing: () => { pending.current = null; setOpen(false); },
    discard: () => {
      const action = pending.current;
      pending.current = null;
      dirtyRef.current = false;
      setOpen(false);
      action?.();
    },
  };
}