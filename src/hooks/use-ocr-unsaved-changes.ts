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
    let currentIndex = window.history.state?.idx ?? 0;
    let restoring = false;
    let allowedPop = false;
    navigator.push = (...args) => guard(() => { push.apply(navigator, args); currentIndex = window.history.state?.idx ?? currentIndex; });
    navigator.replace = (...args) => guard(() => { replace.apply(navigator, args); currentIndex = window.history.state?.idx ?? currentIndex; });
    navigator.go = (...args) => guard(() => go.apply(navigator, args));
    const pop = (event: PopStateEvent) => {
      const index = event.state?.idx ?? currentIndex;
      if (restoring) { restoring = false; event.stopImmediatePropagation(); return; }
      if (!dirtyRef.current || bypass.current || allowedPop) { allowedPop = false; currentIndex = index; return; }
      const delta = index - currentIndex;
      if (delta === 0) return;
      event.stopImmediatePropagation();
      restoring = true;
      window.history.go(-delta);
      guard(() => { allowedPop = true; window.history.go(delta); });
    };
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
    window.addEventListener("popstate", pop, true);
    return () => {
      navigator.push = push;
      navigator.replace = replace;
      navigator.go = go;
      document.removeEventListener("click", capture, true);
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("popstate", pop, true);
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