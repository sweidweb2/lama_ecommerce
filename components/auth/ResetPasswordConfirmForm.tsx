"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/ui/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  LockIcon,
} from "lucide-react";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validators/auth/auth";
import {
  getSession,
  updatePassword,
} from "@/repositories/auth.client.repository";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

type SessionState = "checking" | "ready" | "missing";

export function ResetPasswordConfirmForm() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [isLoading, setIsLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const { data, error } = await getSession();
        if (cancelled) return;
        if (error || !data.session) {
          setSessionState("missing");
          return;
        }
        setSessionState("ready");
      } catch {
        if (!cancelled) setSessionState("missing");
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (data: ChangePasswordInput) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await updatePassword(data.newPassword);
      if (error) {
        toast.error("Password update failed", {
          description: error.message ?? "Please try again.",
        });
        form.setError("root", {
          message: error.message ?? "Please try again.",
        });
        return;
      }

      toast.success("Password updated", {
        description: "You can sign in with your new password.",
      });
      router.replace(ROUTES.LOGIN);
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Something went wrong", {
        description: errorMessage,
      });
      form.setError("root", { message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionState === "checking") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" />
        <p className="text-sm">Verifying reset link…</p>
      </div>
    );
  }

  if (sessionState === "missing") {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Invalid or expired link
          </h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Request a new
            one to continue.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={ROUTES.RESET_PASSWORD}>Request a new link</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.LOGIN}>Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter and confirm your new password below
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showNew ? "text" : "password"}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className={cn(
                        "pl-9 pr-9",
                        form.formState.errors.newPassword && "border-destructive",
                      )}
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                      tabIndex={isLoading ? -1 : 0}
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      className={cn(
                        "pl-9 pr-9",
                        form.formState.errors.confirmPassword &&
                          "border-destructive",
                      )}
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                      tabIndex={isLoading ? -1 : 0}
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirm ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
