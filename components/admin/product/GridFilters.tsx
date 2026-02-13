'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import type { Brand, Category } from '@/types/product'

interface GridFiltersProps {
  brands: Brand[]
  categories: Category[]
}

export function GridFilters({ brands, categories }: GridFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const category = searchParams.get('category') || 'all'
  const brand = searchParams.get('brand') || 'all'
  const featured = searchParams.get('featured') || 'all'
  const trending = searchParams.get('trending') || 'all'
  const active = searchParams.get('active') || 'all'

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(name)
    } else {
      params.set(name, value)
    }
    // Reset page when filtering
    params.delete('page')
    return params.toString()
  }

  const handleFilterChange = (name: string, value: string) => {
    const queryString = createQueryString(name, value)
    router.push(`/admin/products/grid?${queryString}`)
  }

  const hasActiveFilters = 
    category !== 'all' || 
    brand !== 'all' || 
    featured !== 'all' || 
    trending !== 'all' || 
    active !== 'all'

  const clearFilters = () => {
    router.push('/admin/products/grid')
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground h-7"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category-filter" className="text-xs">Category</Label>
          <Select value={category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger id="category-filter" className="h-9">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand-filter" className="text-xs">Brand</Label>
          <Select value={brand} onValueChange={(value) => handleFilterChange('brand', value)}>
            <SelectTrigger id="brand-filter" className="h-9">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((br) => (
                <SelectItem key={br.id} value={br.id}>
                  {br.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="featured-filter" className="text-xs">Featured</Label>
          <Select value={featured} onValueChange={(value) => handleFilterChange('featured', value)}>
            <SelectTrigger id="featured-filter" className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Featured</SelectItem>
              <SelectItem value="false">Not Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trending-filter" className="text-xs">Trending</Label>
          <Select value={trending} onValueChange={(value) => handleFilterChange('trending', value)}>
            <SelectTrigger id="trending-filter" className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Trending</SelectItem>
              <SelectItem value="false">Not Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="active-filter" className="text-xs">Status</Label>
          <Select value={active} onValueChange={(value) => handleFilterChange('active', value)}>
            <SelectTrigger id="active-filter" className="h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
