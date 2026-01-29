"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, Loader2Icon, MailIcon, LockIcon } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validators/auth/auth";
import { loginService } from "@/services/auth.service";
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await loginService(data);

      if (!result.success) {
        toast.error("Login failed", {
          description: result.error,
        });
        form.setError("root", { message: result.error });
        return;
      }

      toast.success("Welcome back!", {
        description: "You've been successfully logged in.",
      });

      // Redirect to the specified redirect URL or home
      const redirectTo = searchParams.get("redirect") || ROUTES.HOME;
      router.push(redirectTo);
      router.refresh(); // Refresh to update server-side state
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

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sign in to your account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to continue
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
                        "pl-9",
                        form.formState.errors.email && "border-destructive"
                      )}
                      disabled={isLoading}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={ROUTES.RESET_PASSWORD}
                    className="text-sm text-primary hover:underline font-medium transition-colors"
                    tabIndex={isLoading ? -1 : 0}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={cn(
                        "pl-9 pr-9",
                        form.formState.errors.password && "border-destructive"
                      )}
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                      tabIndex={isLoading ? -1 : 0}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href={ROUTES.SIGNUP || "/auth/signup"}
          className="text-primary hover:underline font-medium transition-colors"
          tabIndex={isLoading ? -1 : 0}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
