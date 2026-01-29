"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOutIcon, Loader2Icon } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { logoutService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "xs" | "icon-xs" | "icon-sm" | "icon-lg";
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = "ghost",
  size = "default",
  className,
  children,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await logoutService();

      if (!result.success) {
        toast.error("Logout failed", {
          description: result.error,
        });
        return;
      }

      toast.success("Logged out successfully");
      
      // Redirect to home and refresh to clear server-side state
      router.push(ROUTES.HOME);
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoading}
      className={cn(className)}
    >
      {isLoading ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          {children || "Logging out..."}
        </>
      ) : (
        <>
          <LogOutIcon className="size-4" />
          {children || "Log out"}
        </>
      )}
    </Button>
  );
}
