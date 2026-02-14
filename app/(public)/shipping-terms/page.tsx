'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'overview', title: '1. Overview' },
  { id: 'delivery-areas', title: '2. Delivery Areas' },
  { id: 'delivery-times', title: '3. Delivery Times' },
  { id: 'shipping-fees', title: '4. Shipping Fees' },
  { id: 'order-processing', title: '5. Order Processing' },
  { id: 'tracking', title: '6. Order Tracking' },
  { id: 'damage-loss', title: '7. Damage or Loss in Transit' },
  { id: 'international', title: '8. International Shipping' },
  { id: 'contact', title: '9. Contact' },
]

export default function ShippingTermsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id)
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="flex w-full">
        {/* Left Sidebar Navigation */}
        <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto border-r border-border bg-background">
          <nav className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Table of Contents</h3>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      activeSection === section.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 w-full min-w-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12 md:py-16">
            {/* Header */}
            <div className="mb-12 w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Shipping Terms
              </h1>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Company:</strong> LAMA E-Commerce</p>
                <p><strong>Email:</strong> info@lama.com</p>
                <p><strong>Phone:</strong> +1 (234) 567-890</p>
              </div>
            </div>

            {/* Content Sections */}
            <div className="w-full max-w-none space-y-6">
              <Card
                id="overview"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Overview</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Shipping Terms describe how LAMA E-Commerce delivers orders to you. By placing an order, you agree to these terms. Delivery times, fees, and options may vary by location and product availability.
                </p>
              </Card>

              <Card
                id="delivery-areas"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Delivery Areas</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We ship to addresses within the regions and countries listed at checkout. Shipping availability is determined by your delivery address. If your location is not supported, you will be notified before payment.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Some items may have delivery restrictions (e.g., size, weight, or regulatory limits). In such cases, we will inform you and suggest alternatives when possible.
                </p>
              </Card>

              <Card
                id="delivery-times"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Delivery Times</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Estimated delivery windows are shown at checkout and in your order confirmation. They are estimates only and do not guarantee a specific delivery date. Delays can occur due to weather, customs, carrier capacity, or other factors beyond our control.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Business days are typically Monday through Friday, excluding public holidays. Orders placed outside business hours may be processed on the next business day.
                </p>
              </Card>

              <Card
                id="shipping-fees"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Shipping Fees</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Shipping fees depend on your delivery address, order weight, and the shipping method you choose. The exact amount is displayed before you complete your order. Fees may be waived for certain promotions or order thresholds as indicated on the site.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  All fees are in the currency shown at checkout. Taxes or duties may apply in some regions and are your responsibility unless otherwise stated.
                </p>
              </Card>

              <Card
                id="order-processing"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Order Processing</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Once your order is confirmed and payment is received, we prepare your items for shipment. Processing usually takes 1–3 business days. You will receive an email when your order has been shipped.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  If an item is out of stock or delayed, we will contact you with options such as a partial shipment, substitution (where applicable), or refund for the affected item.
                </p>
              </Card>

              <Card
                id="tracking"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Order Tracking</h2>
                <p className="text-muted-foreground leading-relaxed">
                  When your order ships, we will send you a tracking number and a link to track your package with the carrier. Tracking updates depend on the carrier and may not be real-time. If tracking does not update for several days, please contact us and we will follow up with the carrier on your behalf.
                </p>
              </Card>

              <Card
                id="damage-loss"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Damage or Loss in Transit</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  If your order arrives damaged or does not arrive within the expected window, please contact us as soon as possible with your order number and, if applicable, photos of the damage or packaging. We will work with the carrier to resolve the issue and may offer a replacement or refund in line with our return policy.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  For lost or significantly delayed shipments, we will open an investigation with the carrier. Resolution may take several business days. We are not liable for delays or failures caused by the carrier or events outside our control, but we will do our best to find a fair solution.
                </p>
              </Card>

              <Card
                id="international"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. International Shipping</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  For orders shipped across borders, delivery times may be longer due to customs clearance. You are responsible for any import duties, taxes, or fees imposed by your country. The carrier or customs may contact you for payment or documentation; non-compliance can result in delays or return of the shipment.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Some products cannot be shipped to certain countries due to legal or regulatory restrictions. We will not ship to addresses where such restrictions apply.
                </p>
              </Card>

              <Card
                id="contact"
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  For questions about shipping, delivery, or these terms:
                </p>
                <ul className="list-none text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <span>📞</span>
                    <a href="tel:+1234567890" className="text-primary hover:underline">+1 (234) 567-890</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>📧</span>
                    <a href="mailto:info@lama.com" className="text-primary hover:underline">info@lama.com</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>📍</span>
                    <span>Global</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
