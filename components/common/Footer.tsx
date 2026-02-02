'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter,
  Youtube,
  MessageCircle
} from 'lucide-react'

export function Footer() {
  const pathname = usePathname()

  // Hide footer on admin routes and product detail pages
  if (pathname?.startsWith('/admin') || pathname?.match(/^\/products\/[^/]+$/)) {
    return null
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* About Section */}
            <div className="lg:col-span-1">
              <Link href={ROUTES.HOME} className="inline-block mb-4">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  LAMA
                </span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Your trusted destination for quality products. Discover amazing deals and shop with confidence.
              </p>
              <div className="flex items-center gap-4 mt-6">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Customer Service Section */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-4">
                Customer Service
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/contact-us"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shipping"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link
                    href="/returns"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Returns
                  </Link>
                </li>
                <li>
                  <Link
                    href="/size-guide"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Size Guide
                  </Link>
                </li>
              </ul>
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
                    href="/blog"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.CART}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Shopping Cart
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
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    123 Main Street, City, State 12345
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <a
                    href="tel:+1234567890"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    +1 (234) 567-890
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <a
                    href="mailto:info@lama.com"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    info@lama.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  <a
                    href="https://wa.me/1234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} LAMA. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy-policy"
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
