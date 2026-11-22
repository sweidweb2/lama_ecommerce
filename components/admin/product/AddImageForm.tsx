'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { addProductImageAction } from "@/actions/product"
import {
  MAX_SERVER_ACTION_UPLOAD_BYTES,
  MAX_SERVER_ACTION_UPLOAD_LABEL,
} from "@/lib/constants/uploads"

interface AddImageFormProps {
  productId: string
}

export function AddImageForm({ productId }: AddImageFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      return
    }

    if (selectedFile.size > MAX_SERVER_ACTION_UPLOAD_BYTES) {
      toast.error(`Image must be ${MAX_SERVER_ACTION_UPLOAD_LABEL} or smaller`)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.set("product_id", productId)
      formData.set("image", selectedFile)

      await addProductImageAction(formData)
      
      // Reset form
      setSelectedFile(null)
      setPreview(null)
      setOpen(false)
      toast.success("Product image uploaded")
      
      // Refresh the page to show the new image
      router.refresh()
    } catch (error) {
      console.error("Error uploading image:", error)
      const message =
        error instanceof Error ? error.message : "Failed to upload image"
      toast.error("Upload failed", { description: message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreview(null)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Image
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Image</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Select Image</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, PNG, WEBP. Max{" "}
                {MAX_SERVER_ACTION_UPLOAD_LABEL}.
              </p>
            </div>

            {preview && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-muted border">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isUploading}
                disabled={!selectedFile}
              >
                Upload Image
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
