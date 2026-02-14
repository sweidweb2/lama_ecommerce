'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
    /** Called after navigation (e.g. to close mobile nav sheet) */
    onNavigate?: () => void
    /** Called when search query changes (for client-side filtering) */
    onSearchChange?: (query: string) => void
}

export function SearchBar({ onNavigate, onSearchChange }: SearchBarProps = {}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('search') || '')

    // Handle '/' keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault()
                document.getElementById('product-search')?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Update query when URL search param changes
    useEffect(() => {
        const urlQuery = searchParams.get('search') || ''
        setQuery(urlQuery)
        onSearchChange?.(urlQuery)
    }, [searchParams, onSearchChange])

    // If onSearchChange is provided, use client-side filtering
    const isClientSide = !!onSearchChange

    const handleChange = (value: string) => {
        setQuery(value)
        if (isClientSide) {
            onSearchChange?.(value)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (isClientSide) {
            // Client-side filtering, no need to navigate
            return
        }

        const params = new URLSearchParams(searchParams.toString())

        if (query) {
            params.set('search', query)
        } else {
            params.delete('search')
        }

        // Reset page when searching
        params.delete('page')

        router.push(`/products?${params.toString()}`)
        onNavigate?.()
    }

    const clearSearch = () => {
        setQuery('')
        if (isClientSide) {
            onSearchChange?.('')
        } else {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('search')
            params.delete('page')
            router.push(`/products?${params.toString()}`)
            onNavigate?.()
        }
    }

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    id="product-search"
                    type="text"
                    placeholder="Search products... (Press / to focus)"
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    className="pl-9 pr-10 h-10 w-full bg-background border-border focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                    </button>
                )}
            </div>
            {/* Hidden submit button for form submission via Enter key */}
            <button type="submit" className="hidden" />
        </form>
    )
}
