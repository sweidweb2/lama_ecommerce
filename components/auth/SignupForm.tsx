"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/ui/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { signupSchema, type SignupInput } from "@/lib/validators/auth/auth";
import { signupService } from "@/services/auth.service";
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

// Password strength checker
function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong";
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("At least 8 characters");

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("One lowercase letter");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("One uppercase letter");

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("One number");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("One special character");

  if (score <= 2) return { strength: "weak", score, feedback };
  if (score <= 3) return { strength: "medium", score, feedback };
  return { strength: "strong", score, feedback };
}

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = form.watch("password");
  const passwordStrength = useMemo(
    () => (passwordValue ? getPasswordStrength(passwordValue) : null),
    [passwordValue]
  );

  const onSubmit = async (data: SignupInput) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await signupService(data);

      if (!result.success) {
        toast.error("Registration failed", {
          description: result.error,
        });
        form.setError("root", { message: result.error });
        return;
      }

      // Check if email confirmation is required
      if (result.requiresEmailVerification) {
        setEmailSent(true);
        toast.success("Account created successfully!", {
          description: "Please check your email to verify your account.",
        });
      } else {
        // If session is created immediately (email confirmation disabled)
        toast.success("Welcome!", {
          description: "Your account has been created successfully.",
        });
        router.push(ROUTES.HOME);
        router.refresh();
      }
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
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <CheckCircle2Icon className="size-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We{"'"}ve sent a verification link to{" "}
            <span className="font-medium text-foreground">
              {form.getValues("email")}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to verify your account and complete
            registration.
          </p>
        </div>
        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setEmailSent(false);
              form.reset();
            }}
            className="w-full"
          >
            Back to registration
          </Button>
          <Link
            href={ROUTES.LOGIN}
            className="block text-sm text-primary hover:underline font-medium transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your information to get started
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      className={cn(
                        "pl-9",
                        form.formState.errors.name && "border-destructive"
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
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
                <p className="text-xs text-muted-foreground">
                  At least 8 characters required. Strength tips below are optional.
                </p>
                {passwordValue && passwordStrength && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            passwordStrength.strength === "weak" &&
                              "bg-destructive w-1/3",
                            passwordStrength.strength === "medium" &&
                              "bg-yellow-500 w-2/3",
                            passwordStrength.strength === "strong" &&
                              "bg-green-500 w-full"
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium capitalize",
                          passwordStrength.strength === "weak" && "text-destructive",
                          passwordStrength.strength === "medium" && "text-yellow-600 dark:text-yellow-500",
                          passwordStrength.strength === "strong" && "text-green-600 dark:text-green-500"
                        )}
                      >
                        {passwordStrength.strength}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Suggested: {passwordStrength.feedback.join(", ")}
                      </p>
                    )}
                  </div>
                )}
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
            loading={isLoading}
            size="lg"
          >
            Create account
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
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
