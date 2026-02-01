'use client'

import { usePathname } from 'next/navigation'
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function AuthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  
  // Don't apply AuthLayout to privacy policy page
  if (pathname?.includes('/privacy_policy')) {
    return <>{children}</>
  }
  
  return <AuthLayout>{children}</AuthLayout>;
}
