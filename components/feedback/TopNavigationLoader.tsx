"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SAFETY_TIMEOUT_MS = 10_000;
const COMPLETE_FADE_MS = 200;
const BAR_COLOR = "#594C39";

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function getInternalHref(anchor: HTMLAnchorElement): string | null {
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  const hrefAttr = anchor.getAttribute("href");
  if (!hrefAttr || hrefAttr.startsWith("#")) return null;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;

  const next = `${url.pathname}${url.search}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current && !url.hash) return null;

  return next;
}

export function TopNavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  const activeRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;
  const previousRouteKey = useRef(routeKey);

  function clearTimers() {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }

  function start() {
    if (activeRef.current) return;
    activeRef.current = true;
    clearTimers();
    setFading(false);
    setVisible(true);
    setProgress(12);

    tickTimerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 80) return current;
        const step = current < 40 ? 8 : current < 60 ? 4 : 2;
        return Math.min(80, current + step);
      });
    }, 200);

    safetyTimerRef.current = setTimeout(() => {
      finish();
    }, SAFETY_TIMEOUT_MS);
  }

  function finish() {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    setProgress(100);
    setFading(true);

    completeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setFading(false);
      setProgress(0);
    }, COMPLETE_FADE_MS);
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (isModifiedClick(event)) return;
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (getInternalHref(anchor) == null) return;
      start();
    }

    function onPopState() {
      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
    // Intentionally mount-once; start/finish use refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) return;
    previousRouteKey.current = routeKey;
    if (activeRef.current) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      role="progressbar"
      aria-hidden={!visible}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="h-full origin-left transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: fading ? 0 : 1,
          backgroundColor: BAR_COLOR,
        }}
      />
    </div>
  );
}
