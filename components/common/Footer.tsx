'use client'

import { useState } from 'react'
import Link from "@/components/ui/link"
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'
import { 
  Mail, 
  Phone, 
  Instagram, 
  MessageCircle,
  Send
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createLeadAction } from '@/actions/lead'
import { toast } from 'sonner'

// Light logo used only in navbar/footer; site favicon stays /aviora-logo.png
const LOGO_LIGHT = '/aviora-logo-nav-footer-light.png'

export function Footer() {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const logoSrc = LOGO_LIGHT

  // Hide footer on admin routes and product detail pages
  if (pathname?.startsWith('/admin') || pathname?.match(/^\/products\/[^/]+$/)) {
    return null
  }

  return (
    <footer className="border-t bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* About Section */}
            <div className="lg:col-span-1">
              <Link href={ROUTES.HOME} className="inline-block mb-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-secondary rounded">
                <Image
                  src={logoSrc}
                  alt="Aviora Wear"
                  className="h-10 w-auto object-contain"
                  width={140}
                  height={44}
                />
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Your trusted destination for quality products. Discover amazing deals and shop with confidence.
              </p>
              <div className="flex items-center gap-4 mt-6">
                <a
                  href="https://www.instagram.com/aviorawear?igsh=MWoweXB3NmZ3MGJ0dQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                  suppressHydrationWarning
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.tiktok.com/@aviora.wear?_r=1&_t=ZS-93lOZe4HTLI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="TikTok"
                  suppressHydrationWarning
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links Section */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-4">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href={ROUTES.HOME}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about-us"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping-terms"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Shipping Terms
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Us Section */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-4">
                Contact Us
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <a
                    href="tel:+1234567890"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    suppressHydrationWarning
                  >
                    +1 (234) 567-890
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <a
                    href="mailto:info@aviorawear.com"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    suppressHydrationWarning
                  >
                    info@aviorawear.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  <a
                    href="https://wa.me/1234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    suppressHydrationWarning
                  >
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>

            {/* Lead / Newsletter signup */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-4">
                Join our list
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your email to join our list.
              </p>
              <form
                className="flex gap-2 relative"
                action={async (formData) => {
                  setIsSubmitting(true)
                  const result = await createLeadAction(formData)
                  setIsSubmitting(false)
                  if (result.success) {
                    setEmail('')
                    if (result.outcome === "already_subscribed") {
                      toast.success("You're already on our list.")
                    } else if (result.outcome === "resubscribed") {
                      toast.success("Welcome back — you're on our list again.")
                    } else {
                      toast.success("Thanks! You're on our list.")
                    }
                  } else {
                    toast.error(result.error)
                  }
                }}
              >
                {/* Honeypot — leave empty; hidden from users */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] opacity-0 h-0 w-0"
                />
                <Input
                  type="email"
                  name="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-sm flex-1 min-w-0"
                  required
                  disabled={isSubmitting}
                  aria-label="Email for updates"
                />
                <Button
                  type="submit"
                  loading={isSubmitting}
                  loadingText={<span className="sr-only">Subscribe</span>}
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="sr-only">Subscribe</span>
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Aviora Wear. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy_policy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
