"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

const ACTIVITY_THROTTLE_MS = 1000

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "scroll",
  "touchstart",
] as const

interface UseIdleTimeoutOptions {
  enabled: boolean
  timeoutMs: number
  onIdle: () => void
}

/**
 * Calls onIdle after `timeoutMs` with no pointer/keyboard/scroll/touch
 * activity and no in-app route changes. Resets when the tab becomes visible.
 */
export function useIdleTimeout({
  enabled,
  timeoutMs,
  onIdle,
}: UseIdleTimeoutOptions) {
  const pathname = usePathname()
  const onIdleRef = useRef(onIdle)
  const lastResetAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const startTimer = () => {
      clearTimer()
      timerRef.current = setTimeout(() => {
        onIdleRef.current()
      }, timeoutMs)
    }

    const resetTimer = (throttled: boolean) => {
      const now = Date.now()
      if (throttled && now - lastResetAtRef.current < ACTIVITY_THROTTLE_MS) {
        return
      }
      lastResetAtRef.current = now
      startTimer()
    }

    // Pathname change or enable: unthrottled reset
    resetTimer(false)

    const onActivity = () => resetTimer(true)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetTimer(false)
      }
    }

    const listenerOpts: AddEventListenerOptions = {
      capture: true,
      passive: true,
    }

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, onActivity, listenerOpts)
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      clearTimer()
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, onActivity, listenerOpts)
      }
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [enabled, timeoutMs, pathname])
}
