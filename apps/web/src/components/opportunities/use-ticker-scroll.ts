"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";

const dragThreshold = 6;
const pixelsPerSecond = 40;

type Drag = {
  pointerId: number;
  startX: number;
  startScroll: number;
  moved: boolean;
};

export function useTickerScroll(playing: boolean, entryCount: number) {
  const viewport = useRef<HTMLDivElement>(null);
  const firstGroup = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [overflowing, setOverflowing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const list = viewport.current;
    const group = firstGroup.current;
    if (!list || !group) return;

    const measure = () => setOverflowing(group.offsetWidth > list.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(group);
    return () => observer.disconnect();
  }, [entryCount]);

  useEffect(() => {
    const list = viewport.current;
    const group = firstGroup.current;
    if (!list || !group || !overflowing || !playing || hovered || focused || dragging) return;

    let offset = Math.max(0, list.scrollLeft);
    let previous: number | undefined;
    let frame: number;
    let elapsed = 0;
    const desktop = window.matchMedia("(min-width: 1024px)");

    function advance(now: number) {
      if (!list || !group) return;
      if (previous !== undefined && !drag.current) {
        const loopWidth = group.offsetWidth;
        if (loopWidth > list.clientWidth) {
          const step = Math.min(now - previous, 45);
          elapsed += step;
          // Ease back into the motion after a pause without losing subpixel progress.
          const pace = desktop.matches ? Math.min(elapsed / 260, 1) : 1;
          offset = (offset + step * pixelsPerSecond * pace / 1000) % loopWidth;
          list.scrollLeft = offset;
        }
      }
      previous = now;
      frame = requestAnimationFrame(advance);
    }

    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing, overflowing, hovered, focused, dragging]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    if (event.pointerType !== "mouse" || !overflowing) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: event.currentTarget.scrollLeft,
      moved: false,
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const distance = event.clientX - active.startX;
    if (!active.moved) {
      if (Math.abs(distance) < dragThreshold) return;
      active.moved = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }

    event.preventDefault();
    event.currentTarget.scrollLeft = active.startScroll - distance;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
  }

  function blockDragClick(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClick.current || event.detail === 0) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  return { viewport, firstGroup, overflowing, dragging, setHovered, setFocused, startDrag, moveDrag, endDrag, blockDragClick };
}
