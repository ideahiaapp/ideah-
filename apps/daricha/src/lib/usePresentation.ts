"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SLIDE_META, TOTAL_SLIDES } from "@/lib/slideMeta";
import { trackEvent } from "@/lib/tracking";

export type PresentationState = {
  index: number;
  direction: 1 | -1;
  furthest: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
};

export function usePresentation(): PresentationState {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const furthestRef = useRef(0);
  const [furthest, setFurthest] = useState(0);
  const viewed = useRef<Set<number>>(new Set());
  const startedRef = useRef(false);

  const markViewed = useCallback((i: number) => {
    if (viewed.current.has(i)) return;
    viewed.current.add(i);
    const slide = SLIDE_META[i];
    if (slide) trackEvent("slide_view", i, slide.id);
    if (i > furthestRef.current) {
      furthestRef.current = i;
      setFurthest(i);
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("start", 0, SLIDE_META[0].id);
    markViewed(0);
  }, [markViewed]);

  useEffect(() => {
    markViewed(index);
  }, [index, markViewed]);

  const goTo = useCallback((target: number) => {
    setIndex((current) => {
      const clamped = Math.max(0, Math.min(TOTAL_SLIDES - 1, target));
      if (clamped === current) return current;
      setDirection(clamped > current ? 1 : -1);
      return clamped;
    });
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        goTo(0);
      } else if (e.key === "End") {
        goTo(TOTAL_SLIDES - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo]);

  return { index, direction, furthest, next, prev, goTo };
}
