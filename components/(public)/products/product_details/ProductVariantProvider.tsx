'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ProductVariantContextType {
  selectedVariantId: string | null
  setSelectedVariantId: (id: string | null) => void
  selectedColor: string | null
  setSelectedColor: (color: string | null) => void
}

const ProductVariantContext = createContext<ProductVariantContextType | undefined>(undefined)

export function ProductVariantProvider({ children }: { children: ReactNode }) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  return (
    <ProductVariantContext.Provider
      value={{
        selectedVariantId,
        setSelectedVariantId,
        selectedColor,
        setSelectedColor,
      }}
    >
      {children}
    </ProductVariantContext.Provider>
  )
}

export function useProductVariant() {
  const context = useContext(ProductVariantContext)
  if (context === undefined) {
    throw new Error('useProductVariant must be used within ProductVariantProvider')
  }
  return context
}
