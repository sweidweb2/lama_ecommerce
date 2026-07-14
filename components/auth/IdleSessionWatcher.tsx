"use client"

import { useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useIdleTimeout } from "@/hooks/use-idle-timeout"
import { IDLE_TIMEOUT_MS } from "@/lib/constants/session"
import { ROUTES } from "@/lib/constants/routes"
import { logoutService } from "@/services/auth.service"

interface IdleSessionWatcherProps {
  enabled: boolean
}

/**
 * Signs the user out after IDLE_TIMEOUT_MS of inactivity.
 * Renders nothing; mount under AuthProvider for all signed-in users.
 */
export function IdleSessionWatcher({ enabled }: IdleSessionWatcherProps) {
  const router = useRouter()
  const loggingOutRef = useRef(false)

  const onIdle = useCallback(async () => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    try {
      await logoutService()
      toast.info("Session expired due to inactivity")
      router.push(ROUTES.LOGIN)
      router.refresh()
    } finally {
      loggingOutRef.current = false
    }
  }, [router])

  useIdleTimeout({
    enabled,
    timeoutMs: IDLE_TIMEOUT_MS,
    onIdle,
  })

  return null
}
