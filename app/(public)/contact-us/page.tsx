import type { Metadata } from 'next'
import { ContactUsPageClient } from '@/components/(public)/contact-us/ContactUsPageClient'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Aviora Wear. Send a message and our team will get back to you.',
}

export default function ContactUsPage() {
  return <ContactUsPageClient />
}
