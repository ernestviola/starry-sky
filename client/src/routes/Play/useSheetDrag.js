import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MOBILE_QUERY = '(max-width: 700px)';
const DRAG_THRESHOLD_PX = 6;
const FLICK_VELOCITY = 0.5; // px per ms

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query)?.matches ?? false);

  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql?.addEventListener) return undefined;
    const onChange = (event) => setMatches(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

/* Collapse the list inside the inset panel so its border and bottom gutter
 * stay visible. Measure the inner content, independently of its animated wrapper. */
const useSheetDrag = ({ expanded, setExpanded, visible = true }) => {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  const previewRef = useRef(null);
  const drag = useRef(null);
  const justDragged = useRef(false);

  const setOffset = useCallback((offset) => {
    const panel = panelRef.current;
    const body = bodyRef.current;
    if (!panel || !body) return;
    const range = body.firstElementChild?.offsetHeight || 1;
    panel.style.setProperty('--sheet-body-size', `${Math.max(0, range - offset)}px`);
    const previewHeight = previewRef.current?.offsetHeight || 0;
    panel.style.setProperty('--sheet-preview-size', `${(offset / range) * previewHeight}px`);
    // Keep the full list invisible and inert when collapsed; the preview stays visible.
    panel.style.setProperty('--sheet-progress', String(1 - offset / range));
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const body = bodyRef.current;
    if (!panel || !body) return undefined;

    if (!isMobile) {
      panel.style.removeProperty('--sheet-body-size');
      panel.style.removeProperty('--sheet-progress');
      panel.style.removeProperty('--sheet-preview-size');
      return undefined;
    }

    const place = () => {
      if (!drag.current?.moved) setOffset(expanded ? 0 : body.firstElementChild.offsetHeight);
    };
    place();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(place);
    observer.observe(body.firstElementChild);
    if (previewRef.current) observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [expanded, isMobile, setOffset, visible]);

  const onPointerDown = (event) => {
    if (!isMobile || event.button !== 0) return;
    const range = bodyRef.current.firstElementChild.offsetHeight;
    const now = performance.now();
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      range,
      startOffset: expanded ? 0 : range,
      offset: expanded ? 0 : range,
      lastY: event.clientY,
      lastTime: now,
      velocity: 0,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const dy = event.clientY - state.startY;

    if (!state.moved) {
      if (Math.abs(dy) < DRAG_THRESHOLD_PX) return;
      state.moved = true;
      panelRef.current.dataset.dragging = 'true'; // turns transitions off
    }

    // Speed of the latest movement, so a quick flick at the end counts.
    const now = performance.now();
    const dt = now - state.lastTime;
    if (dt > 0) state.velocity = (event.clientY - state.lastY) / dt;
    state.lastY = event.clientY;
    state.lastTime = now;

    state.offset = Math.min(state.range, Math.max(0, state.startOffset + dy));
    setOffset(state.offset);
  };

  const settle = (open, range) => {
    delete panelRef.current.dataset.dragging; // transitions back on
    setOffset(open ? 0 : range);
    setExpanded(open);
  };

  const onPointerUp = (event) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    drag.current = null;

    if (!state.moved) {
      // The header click also handles keyboard activation.
      return;
    }

    // A drag still fires a header click; skip that one.
    justDragged.current = true;
    setTimeout(() => {
      justDragged.current = false;
    }, 0);

    let open;
    if (state.velocity < -FLICK_VELOCITY) open = true;
    else if (state.velocity > FLICK_VELOCITY) open = false;
    else open = state.offset < state.range / 2;

    settle(open, state.range);
  };

  const onPointerCancel = () => {
    const state = drag.current;
    drag.current = null;
    if (state?.moved) settle(expanded, state.range);
  };

  return {
    panelRef,
    bodyRef,
    previewRef,
    isMobile,
    consumeDragClick: () => justDragged.current,
    headerHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
};

export default useSheetDrag;
