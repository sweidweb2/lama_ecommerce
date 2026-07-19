"use client";

import { useState } from "react";
import Link from "@/components/ui/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2Icon, Loader2Icon, MailIcon } from "lucide-react";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "@/lib/validators/auth/auth";
import { requestPasswordResetService } from "@/services/auth.service";
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

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: RequestPasswordResetInput) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await requestPasswordResetService(data);

      if (!result.success) {
        toast.error("Reset failed", {
          description: result.error,
        });
        form.setError("root", { message: result.error });
        return;
      }

      setEmailSent(true);
      toast.success("Check your email", {
        description:
          "If an account exists for that address, we sent a reset link.",
      });
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

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2Icon className="size-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for that address, we sent a password reset
            link. It may take a few minutes to arrive.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={ROUTES.LOGIN}
            className="text-primary hover:underline font-medium transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to choose a new
          password
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={cn(
                        "pl-9 !bg-background",
                        form.formState.errors.email && "border-destructive",
                      )}
                      style={{
                        WebkitBoxShadow:
                          "0 0 0 1000px hsl(var(--background)) inset",
                        boxShadow: "0 0 0 1000px hsl(var(--background)) inset",
                      }}
                      disabled={isLoading}
                      {...field}
                    />
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
                Sending link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href={ROUTES.LOGIN}
          className="text-primary hover:underline font-medium transition-colors"
          tabIndex={isLoading ? -1 : 0}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
