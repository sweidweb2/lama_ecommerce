import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalLayout } from "@/components/layout/ConditionalMain";
import { TopNavigationLoader } from "@/components/feedback/TopNavigationLoader";

// Main font: Bagina (see globals.css).
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Aviora Wear",
    template: "%s | Aviora Wear",
  },
  description: "Modern ecommerce experience by Aviora Wear.",
  icons: {
    icon: "/aviora-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <Suspense fallback={null}>
            <TopNavigationLoader />
          </Suspense>
          <AuthProvider>
            <Suspense fallback={<div className="flex min-h-screen flex-col"><main className="flex-1">{children}</main></div>}>
              <ConditionalLayout>{children}</ConditionalLayout>
            </Suspense>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
