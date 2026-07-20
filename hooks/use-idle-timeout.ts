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
  /** Fired once per idle cycle when `timeoutMs - warningBeforeMs` elapses. */
  onWarning?: () => void
  /** Lead time before logout for `onWarning`. Ignored unless `onWarning` is set. */
  warningBeforeMs?: number
  /** Called whenever the idle timers are restarted (activity, visibility, route). */
  onReset?: () => void
}

/**
 * Calls onIdle after `timeoutMs` with no pointer/keyboard/scroll/touch
 * activity and no in-app route changes. Resets when the tab becomes visible.
 * Optionally warns once via onWarning before logout.
 */
export function useIdleTimeout({
  enabled,
  timeoutMs,
  onIdle,
  onWarning,
  warningBeforeMs,
  onReset,
}: UseIdleTimeoutOptions) {
  const pathname = usePathname()
  const onIdleRef = useRef(onIdle)
  const onWarningRef = useRef(onWarning)
  const onResetRef = useRef(onReset)
  const lastResetAtRef = useRef(0)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningFiredRef = useRef(false)

  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  useEffect(() => {
    onWarningRef.current = onWarning
  }, [onWarning])

  useEffect(() => {
    onResetRef.current = onReset
  }, [onReset])

  useEffect(() => {
    const clearTimers = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current)
        warningTimerRef.current = null
      }
    }

    if (!enabled) {
      clearTimers()
      warningFiredRef.current = false
      return
    }

    const startTimers = () => {
      clearTimers()
      warningFiredRef.current = false

      const lead =
        typeof warningBeforeMs === "number" && warningBeforeMs > 0
          ? warningBeforeMs
          : 0
      const warningDelay = timeoutMs - lead

      if (onWarningRef.current && lead > 0 && warningDelay > 0) {
        warningTimerRef.current = setTimeout(() => {
          if (warningFiredRef.current) return
          warningFiredRef.current = true
          onWarningRef.current?.()
        }, warningDelay)
      }

      idleTimerRef.current = setTimeout(() => {
        onIdleRef.current()
      }, timeoutMs)
    }

    const resetTimer = (throttled: boolean) => {
      const now = Date.now()
      if (throttled && now - lastResetAtRef.current < ACTIVITY_THROTTLE_MS) {
        return
      }
      lastResetAtRef.current = now
      onResetRef.current?.()
      startTimers()
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
      clearTimers()
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, onActivity, listenerOpts)
      }
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [enabled, timeoutMs, warningBeforeMs, pathname])
}
