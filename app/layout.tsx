import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { getCurrentUserProfile } from "@/services/profile.service";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalLayout } from "@/components/layout/ConditionalMain";

// Main font: Bagina (see globals.css). Mono: Geist Mono.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aviora Wear",
  description: "Modern ecommerce experience by Aviora Wear.",
  icons: {
    icon: "/aviora-logo.png",
  },
};

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider initialProfile={profile}>
            <ConditionalLayout>{children}</ConditionalLayout>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
