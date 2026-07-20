'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ROUTES } from '@/lib/constants/routes'
import { useAuth } from '@/providers/AuthProvider'
import { ROLES } from '@/lib/constants/roles'
import { createProductQuestionAction } from '@/actions/product_question'
import type { PublicProductQuestionRow } from '@/repositories/product_question.repository'

interface ProductQAProps {
  productId: string
  productSlug: string
  questions?: PublicProductQuestionRow[]
  isAuthenticated: boolean
}

/**
 * Storefront product Q&A: list approved Q&A and let customers ask (pending until answered).
 */
export function ProductQA({
  productId,
  productSlug,
  questions = [],
  isAuthenticated,
}: ProductQAProps) {
  const { role } = useAuth()
  const isAdmin = role === ROLES.ADMIN
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loginHref = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(`/products/${productSlug}`)}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) {
      toast.error('Please write a question')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createProductQuestionAction({
        product_id: productId,
        question: question.trim(),
        product_slug: productSlug,
      })
      if (result.success) {
        toast.success('Question submitted', {
          description: 'It will appear here after an admin answers it.',
        })
        setQuestion('')
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to submit question.',
        })
      }
    } catch {
      toast.error('Error', {
        description: 'Failed to submit question. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Questions & Answers</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {questions.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto hide-scrollbar space-y-6 pr-2">
              {questions.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 pb-6 border-b last:border-0"
                >
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Question
                    </p>
                    <p className="mt-1 font-medium leading-relaxed">
                      {item.question}
                    </p>
                  </div>
                  {item.answer ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Answer
                      </p>
                      <p className="mt-1 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {item.answer}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No questions yet</p>
              <p className="text-sm">Be the first to ask about this product.</p>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Ask a Question</h3>

            {isAdmin ? (
              <div className="space-y-4 rounded-lg border p-6">
                <p className="text-muted-foreground">
                  Admins answer questions from the admin panel, not the storefront.
                </p>
                <Button asChild size="lg" className="w-full" variant="outline">
                  <Link href="/admin/qa">Go to Q&amp;A Admin</Link>
                </Button>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-4 rounded-lg border p-6">
                <p className="text-muted-foreground">
                  Sign in to ask a question about this product.
                </p>
                <Button asChild size="lg" className="w-full">
                  <Link href={loginHref}>Sign in to ask</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-qa-question">
                    Your question <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="product-qa-question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask about sizing, materials, shipping…"
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit question'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
