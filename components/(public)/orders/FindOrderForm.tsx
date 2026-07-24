"use client";

import { useState } from "react";
import Link from "@/components/ui/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2Icon, MailIcon, HashIcon } from "lucide-react";
import {
  findOrderSchema,
  type FindOrderInput,
} from "@/lib/validators/order/find";
import { requestOrderAccessLinkAction } from "@/actions/order_access";
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

export function FindOrderForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<FindOrderInput>({
    resolver: zodResolver(findOrderSchema),
    defaultValues: {
      email: "",
      shortOrderId: "",
    },
  });

  const onSubmit = async (data: FindOrderInput) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await requestOrderAccessLinkAction(data);

      if (!result.success) {
        toast.error("Request failed", {
          description: result.error,
        });
        form.setError("root", { message: result.error });
        return;
      }

      setEmailSent(true);
      toast.success("Check your email", {
        description: result.message,
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
      <div className="space-y-6 text-center max-w-md mx-auto">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2Icon className="size-6 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If we found a matching order, we sent a link to that address. It may
            take a few minutes to arrive.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={ROUTES.ORDERS}
            className="text-primary hover:underline font-medium transition-colors"
          >
            Back to orders
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Find your order</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email from checkout and the 8-character code from your
          confirmation email (for example{" "}
          <span className="font-mono">#A1B2C3D4</span>).
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
                        "pl-10",
                        form.formState.errors.email && "border-destructive",
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
            name="shortOrderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order code</FormLabel>
                <FormControl>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="A1B2C3D4"
                      autoComplete="off"
                      maxLength={8}
                      className={cn(
                        "pl-10 font-mono uppercase",
                        form.formState.errors.shortOrderId &&
                          "border-destructive",
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

          {form.formState.errors.root && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" loading={isLoading}>
            Email me a link
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={ROUTES.ORDERS}
          className="text-primary hover:underline font-medium transition-colors"
        >
          Back to orders
        </Link>
      </p>
    </div>
  );
}
