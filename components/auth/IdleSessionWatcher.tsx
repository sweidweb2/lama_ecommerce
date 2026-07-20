"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useIdleTimeout } from "@/hooks/use-idle-timeout"
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_BEFORE_MS,
} from "@/lib/constants/session"
import { ROUTES } from "@/lib/constants/routes"
import { logoutService } from "@/services/auth.service"

const IDLE_WARNING_TOAST_ID = "idle-warning"

interface IdleSessionWatcherProps {
  enabled: boolean
}

/**
 * Signs the user out after IDLE_TIMEOUT_MS of inactivity.
 * Warns IDLE_WARNING_BEFORE_MS before logout. Renders nothing; mount under
 * AuthProvider for all signed-in users.
 */
export function IdleSessionWatcher({ enabled }: IdleSessionWatcherProps) {
  const router = useRouter()
  const loggingOutRef = useRef(false)

  const dismissWarning = useCallback(() => {
    toast.dismiss(IDLE_WARNING_TOAST_ID)
  }, [])

  useEffect(() => {
    if (!enabled) dismissWarning()
  }, [enabled, dismissWarning])

  const onWarning = useCallback(() => {
    toast.warning(
      "Your session will expire in 2 minutes due to inactivity",
      { id: IDLE_WARNING_TOAST_ID, duration: IDLE_WARNING_BEFORE_MS },
    )
  }, [])

  const onIdle = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    dismissWarning()
    try {
      await logoutService()
      toast.info("Session expired due to inactivity")
      router.push(ROUTES.LOGIN)
      router.refresh()
    } finally {
      loggingOutRef.current = false
    }
  }, [dismissWarning, router])

  useIdleTimeout({
    enabled,
    timeoutMs: IDLE_TIMEOUT_MS,
    warningBeforeMs: IDLE_WARNING_BEFORE_MS,
    onIdle,
    onWarning,
    onReset: dismissWarning,
  })

  return null
}
