'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information', title: '2. Information We Collect' },
  { id: 'usage', title: '3. How We Use Your Information' },
  { id: 'legal-basis', title: '4. Legal Basis for Processing' },
  { id: 'storage', title: '5. Data Storage and Security' },
  { id: 'retention', title: '6. Data Retention' },
  { id: 'sharing', title: '7. Sharing of Information' },
  { id: 'transfers', title: '8. International Transfers' },
  { id: 'rights', title: '9. Your Rights' },
  { id: 'cookies', title: '10. Cookies and Tracking' },
  { id: 'children', title: '11. Children Privacy' },
  { id: 'changes', title: '12. Changes to This Policy' },
  { id: 'contact', title: '13. Contact Us' },
]

export default function PolicyPage() {
  const [activeSection, setActiveSection] = useState('introduction')

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
                Privacy Policy
              </h1>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Company:</strong> LAMA E-Commerce</p>
                <p><strong>Location:</strong> Global</p>
                <p><strong>Email:</strong> info@lama.com</p>
                <p><strong>Phone:</strong> +1 (234) 567-890</p>
              </div>
            </div>

            {/* Content Sections */}
            <div className="w-full max-w-none space-y-6">
              <Card 
                id="introduction" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Your privacy is important to us. This Privacy Policy explains how LAMA ("we," "us," "our") collects, uses, and protects your personal information when you use our Platform and services.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We are committed to protecting your privacy and ensuring the security of your personal data in accordance with applicable data protection laws and regulations.
                </p>
              </Card>

              <Card 
                id="information" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We may collect the following categories of information:
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                    <p className="text-muted-foreground leading-relaxed">Name, phone number, email address, shipping address, billing address</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Account Data</h3>
                    <p className="text-muted-foreground leading-relaxed">Username, password (encrypted), account preferences, order history</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Payment Data</h3>
                    <p className="text-muted-foreground leading-relaxed">Transaction details (processed via secure third parties; no credit-card numbers stored on our servers)</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Technical Data</h3>
                    <p className="text-muted-foreground leading-relaxed">Browser type, IP address, device identifiers, usage statistics, cookies</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Communications</h3>
                    <p className="text-muted-foreground leading-relaxed">Emails, chat messages, support inquiries, feedback</p>
                  </div>
                </div>
              </Card>

              <Card 
                id="usage" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We use your data to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Process and fulfill your orders</li>
                  <li>Manage your account and preferences</li>
                  <li>Improve our website and services</li>
                  <li>Send service-related updates and promotional offers (with your consent)</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Ensure compliance with legal obligations</li>
                  <li>Prevent fraud and enhance security</li>
                </ul>
              </Card>

              <Card 
                id="legal-basis" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Legal Basis for Processing</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We process personal data based on:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Consent (for marketing or optional data)</li>
                  <li>Contractual necessity (to deliver the service you requested)</li>
                  <li>Legal obligation (to comply with applicable laws or court orders)</li>
                  <li>Legitimate interest (for service improvement and fraud prevention)</li>
                </ul>
              </Card>

              <Card 
                id="storage" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Storage and Security</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  All personal data are stored securely on encrypted servers with industry-standard security measures.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We implement technical, administrative, and physical safeguards to prevent unauthorized access, alteration, or disclosure of your personal information.
                </p>
              </Card>

              <Card 
                id="retention" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain user data only as long as necessary to provide services or meet legal obligations. Account data and order history are retained for as long as your account is active, and for a reasonable period thereafter for legal and business purposes.
                </p>
              </Card>

              <Card 
                id="sharing" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Sharing of Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We may share limited data with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Payment processors for secure transactions</li>
                  <li>Shipping providers to fulfill your orders</li>
                  <li>Service providers who assist in operating our platform</li>
                  <li>Legal authorities if required by law</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  We never sell or rent personal data to third parties for marketing purposes.
                </p>
              </Card>

              <Card 
                id="transfers" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. International Transfers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Where data are transferred internationally, appropriate safeguards and data-transfer agreements are applied consistent with applicable data protection laws.
                </p>
              </Card>

              <Card 
                id="rights" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Access and obtain a copy of your personal data</li>
                  <li>Request correction or deletion of your data</li>
                  <li>Withdraw consent at any time</li>
                  <li>Object to certain processing activities</li>
                  <li>Request data portability</li>
                  <li>File a complaint with relevant data protection authorities</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  To exercise these rights, please contact us at <a href="mailto:info@lama.com" className="text-primary hover:underline">info@lama.com</a>.
                </p>
              </Card>

              <Card 
                id="cookies" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookies and Tracking</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our website uses cookies and analytics tools to improve usability and provide a better user experience. You may disable cookies in your browser settings; however, some features may not function properly.
                </p>
              </Card>

              <Card 
                id="children" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not knowingly collect information from minors under 13. Parents or guardians who believe a child has provided data may contact us for immediate deletion.
                </p>
              </Card>

              <Card 
                id="changes" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy periodically. The revised version will be posted on our website with an updated effective date. Continued use of our Platform constitutes acceptance of the updated policy.
                </p>
              </Card>

              <Card 
                id="contact" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  For privacy-related questions or to exercise your rights:
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
