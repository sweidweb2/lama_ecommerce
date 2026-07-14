"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "top-center" : "top-right"}
      offset={isMobile ? "16px" : "80px"}
      closeButton
      toastOptions={{
        className: "mobile-toast",
        classNames: {
          toast:
            "group toast group-[.toaster]:border-0 group-[.toaster]:shadow-lg group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:!bg-transparent group-[.toast]:!border-current/25 group-[.toast]:!text-current group-[.toast]:opacity-70 group-[.toast]:hover:!opacity-100 group-[.toast]:hover:!bg-current/10",
          success:
            "!bg-success-muted !text-success !border-0 !border-l-[3px] !border-l-success [&_[data-icon]]:!text-success [&_[data-description]]:!text-success/80",
          error:
            "!bg-destructive/10 !text-destructive !border-0 !border-l-[3px] !border-l-destructive dark:!bg-destructive/20 [&_[data-icon]]:!text-destructive [&_[data-description]]:!text-destructive/80",
          warning:
            "!bg-amber-50 !text-amber-800 !border-0 !border-l-[3px] !border-l-amber-500 dark:!bg-amber-950/40 dark:!text-amber-200 [&_[data-icon]]:!text-amber-600 dark:[&_[data-icon]]:!text-amber-400",
          info: "!bg-muted !text-foreground !border-0 !border-l-[3px] !border-l-primary [&_[data-icon]]:!text-primary [&_[data-description]]:!text-muted-foreground",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        close: <XIcon className="size-3.5" />,
      }}
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--success-bg": "hsl(var(--success-muted))",
          "--success-text": "hsl(var(--success))",
          "--success-border": "hsl(var(--success-border))",
          "--error-bg": "hsl(var(--destructive) / 0.1)",
          "--error-text": "hsl(var(--destructive))",
          "--error-border": "hsl(var(--destructive) / 0.4)",
          "--info-bg": "hsl(var(--muted))",
          "--info-text": "hsl(var(--foreground))",
          "--info-border": "hsl(var(--primary))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
