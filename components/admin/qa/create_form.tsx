'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

export type AdminQuestion = {
  id: string
  product_id: string
  product_name: string
  user_id: string | null
  user_name: string | null
  question: string
  answer: string | null
  is_approved: boolean
  created_at?: string
}

const DUMMY_PRODUCTS = [
  { id: "prod-1", name: "Wireless Headphones" },
  { id: "prod-2", name: "Smart Watch" },
  { id: "prod-3", name: "Laptop Stand" },
]

const DUMMY_USERS = [
  { id: "user-1", name: "John Doe" },
  { id: "user-2", name: "Jane Smith" },
  { id: "user-3", name: "Bob Johnson" },
]

const NONE_VALUE = "__none__"

export function CreateQuestionDialog() {
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState<string>("")
  const [userId, setUserId] = useState<string>(NONE_VALUE)
  const [question, setQuestion] = useState<string>("")
  const [answer, setAnswer] = useState<string>("")
  const [isApproved, setIsApproved] = useState<string>("false")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId || !question.trim()) {
      return
    }

    const product = DUMMY_PRODUCTS.find((p) => p.id === productId)
    const user = userId !== NONE_VALUE ? DUMMY_USERS.find((u) => u.id === userId) : null

    const newQuestion: Omit<AdminQuestion, "id"> = {
      product_id: productId,
      product_name: product?.name || "Unknown product",
      user_id: user?.id || null,
      user_name: user?.name || null,
      question: question.trim(),
      answer: answer.trim() || null,
      is_approved: isApproved === "true",
      created_at: new Date().toISOString(),
    }

    // TODO: Wire this up to a real admin create action / API
    console.log("Creating question:", newQuestion)

    setProductId("")
    setUserId(NONE_VALUE)
    setQuestion("")
    setAnswer("")
    setIsApproved("false")
    setOpen(false)
  }

  const handleCancel = () => {
    setProductId("")
    setUserId(NONE_VALUE)
    setQuestion("")
    setAnswer("")
    setIsApproved("false")
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Create Question
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Question</DialogTitle>
          </DialogHeader>

          <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="qa-product">
                Product <span className="text-destructive">*</span>
              </Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="qa-product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_PRODUCTS.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-user">User (optional)</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="qa-user">
                  <SelectValue placeholder="Select a user or leave as guest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Guest / Anonymous</SelectItem>
                  {DUMMY_USERS.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-question">
                Question <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="qa-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Write the customer question here..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-answer">Answer (optional)</Label>
              <Textarea
                id="qa-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write the admin answer here..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-approved">Approved</Label>
              <Select
                value={isApproved}
                onValueChange={setIsApproved}
              >
                <SelectTrigger id="qa-approved">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Pending</SelectItem>
                  <SelectItem value="true">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!productId || !question.trim()}>
                Create Question
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

