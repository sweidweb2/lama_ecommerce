'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Services' },
  { id: 'eligibility', title: '3. Eligibility' },
  { id: 'account', title: '4. Account Registration and Security' },
  { id: 'payments', title: '5. Payments and Refunds' },
  { id: 'responsibilities', title: '6. User Responsibilities' },
  { id: 'intellectual', title: '7. Intellectual Property' },
  { id: 'confidentiality', title: '8. Confidentiality and Data Protection' },
  { id: 'modifications', title: '9. Service Modifications and Availability' },
  { id: 'liability', title: '10. Limitation of Liability' },
  { id: 'indemnification', title: '11. Indemnification' },
  { id: 'governing', title: '12. Governing Law and Jurisdiction' },
  { id: 'changes', title: '13. Changes to Terms' },
  { id: 'contact', title: '14. Contact' },
]

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance')

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
                Terms of Service
              </h1>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Company:</strong> Aviora Wear</p>
                <p><strong>Location:</strong> Global</p>
                <p><strong>Email:</strong> info@aviorawear.com</p>
                <p><strong>Phone:</strong> +1 (234) 567-890</p>
              </div>
            </div>

            {/* Content Sections */}
            <div className="w-full max-w-none space-y-6">
              <Card 
                id="acceptance" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using the Aviora Wear website, platform, or any associated digital services ({'"'}Platform{'"'}), you agree to be bound by these Terms of Service ({'"'}Terms{'"'}). If you do not agree, you must not use the Platform.
                </p>
              </Card>

              <Card 
                id="description" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Aviora Wear provides an online marketplace platform for purchasing products, including but not limited to electronics, clothing, accessories, and other consumer goods.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Services are delivered online through our web platform. Aviora Wear facilitates transactions between customers and sellers, processes payments securely, and manages order fulfillment.
                </p>
              </Card>

              <Card 
                id="eligibility" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Eligibility</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Users must be at least 18 years old or obtain verifiable consent from a parent or guardian. By using the Platform, you confirm you have legal capacity to enter into binding agreements.
                </p>
              </Card>

              <Card 
                id="account" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Account Registration and Security</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Users may be required to create an account to make purchases. You are responsible for maintaining confidentiality of login credentials and for all activities under your account.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You must notify Aviora Wear immediately of any unauthorized use or security breach of your account.
                </p>
              </Card>

              <Card 
                id="payments" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Payments and Refunds</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  All prices are listed in U.S. Dollars unless otherwise indicated. Payments are processed through secure third-party payment gateways.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Refunds are processed according to our return policy. Eligible items may be returned within 30 days of purchase, subject to our return policy terms. Contact us at <a href="mailto:info@aviorawear.com" className="text-primary hover:underline">info@aviorawear.com</a> for refund requests.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  All sales are final for digital products, personalized items, and items marked as non-refundable.
                </p>
              </Card>

              <Card 
                id="responsibilities" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. User Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide accurate information when creating an account and placing orders</li>
                  <li>Use the Platform in accordance with applicable laws and regulations</li>
                  <li>Respect intellectual property rights of Aviora Wear and third parties</li>
                  <li>Not engage in any fraudulent, abusive, or illegal activities</li>
                  <li>Not attempt to circumvent security measures or payment systems</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Aviora Wear reserves the right to suspend or terminate accounts that violate these terms or legal obligations.
                </p>
              </Card>

              <Card 
                id="intellectual" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  The Aviora Wear platform, including its design, code, logos, and proprietary features, is owned by Aviora Wear or its licensors and protected under copyright and trademark law.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Product images, descriptions, and other content provided by sellers remain the property of their respective owners. By listing products on our platform, sellers grant Aviora Wear a license to display and promote their content.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  You may not reproduce, distribute, or create derivative works of the Platform without written permission from Aviora Wear.
                </p>
              </Card>

              <Card 
                id="confidentiality" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Confidentiality and Data Protection</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Aviora Wear collects and processes personal data in accordance with applicable data protection laws and regulations.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We implement technical and organizational safeguards to protect your information. Details are outlined in our <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </Card>

              <Card 
                id="modifications" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Service Modifications and Availability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may modify or discontinue any part of the Platform at our discretion without prior notice. Aviora Wear will make reasonable efforts to inform active users of material changes that affect ongoing services or orders.
                </p>
              </Card>

              <Card 
                id="liability" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  To the fullest extent permitted by law, Aviora Wear and its employees and directors shall not be liable for any indirect, incidental, or consequential damages arising from use of our Platform or services.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Aviora Wear is not responsible for product quality, accuracy of product descriptions, or any transactions between customers and sellers beyond our role as a platform facilitator.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our total liability for any claim shall not exceed the total amount paid by the user for the product or service in question.
                </p>
              </Card>

              <Card 
                id="indemnification" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify and hold harmless Aviora Wear from any claims, losses, or damages resulting from your misuse of the Platform, violation of these Terms, or infringement of third-party rights.
                </p>
              </Card>

              <Card 
                id="governing" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Governing Law and Jurisdiction</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These Terms are governed by applicable laws and regulations in the jurisdiction where Aviora Wear operates.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Any dispute shall be resolved through binding arbitration or in the courts of competent jurisdiction, as determined by applicable law.
                </p>
              </Card>

              <Card 
                id="changes" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Aviora Wear reserves the right to amend these Terms at any time. Updated versions will be posted on the Platform with the effective date. Continued use of the Platform constitutes acceptance of revised Terms.
                </p>
              </Card>

              <Card 
                id="contact" 
                className="mb-8 scroll-mt-24 p-6 w-full"
              >
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Contact</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  For any inquiries regarding these Terms:
                </p>
                <ul className="list-none text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <span>📞</span>
                    <a href="tel:+1234567890" className="text-primary hover:underline">+1 (234) 567-890</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>📧</span>
                    <a href="mailto:info@aviorawear.com" className="text-primary hover:underline">info@aviorawear.com</a>
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
