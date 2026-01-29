import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Home Link */}
        <div className="mb-8 text-center">
          <Link
            href={ROUTES.HOME}
            className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
          >
            E-Commerce
          </Link>
        </div>

        {/* Auth Form Container */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          {children}
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href={ROUTES.HOME}
            className="hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
