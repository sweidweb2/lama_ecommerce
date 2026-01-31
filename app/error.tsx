"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HomeIcon, RefreshCwIcon, AlertCircleIcon, ServerCrashIcon, FileQuestionIcon } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  // Determine error type based on error message or digest
  const getErrorInfo = () => {
    const message = error.message?.toLowerCase() || "";
    const digest = error.digest || "";

    // 404-like errors
    if (
      message.includes("not found") ||
      message.includes("404") ||
      digest.includes("NEXT_NOT_FOUND")
    ) {
      return {
        title: "Page Not Found",
        description: "The page you're looking for doesn't exist or has been moved.",
        icon: FileQuestionIcon,
        statusCode: 404,
        showRetry: false,
      };
    }

    // 500-like errors
    if (
      message.includes("server error") ||
      message.includes("500") ||
      message.includes("internal") ||
      digest.includes("NEXT_INTERNAL_ERROR")
    ) {
      return {
        title: "Server Error",
        description: "Something went wrong on our end. Please try again later.",
        icon: ServerCrashIcon,
        statusCode: 500,
        showRetry: true,
      };
    }

    // Network errors
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection")
    ) {
      return {
        title: "Connection Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        icon: AlertCircleIcon,
        statusCode: "NETWORK",
        showRetry: true,
      };
    }

    // Authentication errors
    if (
      message.includes("unauthorized") ||
      message.includes("authentication") ||
      message.includes("401")
    ) {
      return {
        title: "Authentication Required",
        description: "You need to be logged in to access this page.",
        icon: AlertCircleIcon,
        statusCode: 401,
        showRetry: false,
      };
    }

    // Generic error
    return {
      title: "Something Went Wrong",
      description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
      icon: AlertCircleIcon,
      statusCode: "ERROR",
      showRetry: true,
    };
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <Icon className="h-12 w-12 text-destructive" />
          </div>
        </div>

        {/* Error Title */}
        <div className="space-y-2">
          {errorInfo.statusCode && (
            <p className="text-sm font-medium text-muted-foreground">
              Error {errorInfo.statusCode}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{errorInfo.title}</h1>
          <p className="text-muted-foreground">{errorInfo.description}</p>
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
          {errorInfo.showRetry && (
            <Button onClick={reset} variant="default" className="w-full sm:w-auto">
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button
            onClick={() => router.push(ROUTES.HOME)}
            variant={errorInfo.showRetry ? "outline" : "default"}
            className="w-full sm:w-auto"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
