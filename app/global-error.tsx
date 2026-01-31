"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon, HomeIcon, ServerCrashIcon } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 bg-background">
          <div className="mx-auto max-w-md text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <ServerCrashIcon className="h-12 w-12 text-destructive" />
              </div>
            </div>

            {/* Error Content */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Critical Error</h1>
              <p className="text-muted-foreground">
                A critical error occurred that prevented the application from loading properly.
                Please try refreshing the page.
              </p>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="rounded-lg border bg-muted p-4 text-left">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {error.message || "Unknown error"}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs font-mono text-muted-foreground">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={reset} variant="default" className="w-full sm:w-auto">
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = "/"}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
