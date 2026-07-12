'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/lib/constants/routes'

interface SearchBarProps {
    /** Called after navigation (e.g. to close mobile nav sheet) */
    onNavigate?: () => void
    /** Called when search query changes (for client-side filtering) */
    onSearchChange?: (query: string) => void
    /**
     * Destination for form submit. Default: dedicated `/search` with `q`.
     * Pass products catalog path when searching within `/products` filters.
     */
    href?: typeof ROUTES.SEARCH | typeof ROUTES.PRODUCTS
}

export function SearchBar({
    onNavigate,
    onSearchChange,
    href = ROUTES.SEARCH,
}: SearchBarProps = {}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryParam = href === ROUTES.PRODUCTS ? 'search' : 'q'
    const [query, setQuery] = useState(
        searchParams.get(queryParam) || searchParams.get('search') || searchParams.get('q') || '',
    )

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
        const urlQuery =
            searchParams.get(queryParam) ||
            searchParams.get('search') ||
            searchParams.get('q') ||
            ''
        setQuery(urlQuery)
        onSearchChange?.(urlQuery)
    }, [searchParams, onSearchChange, queryParam])

    // If onSearchChange is provided, use client-side filtering
    const isClientSide = !!onSearchChange

    const handleChange = (value: string) => {
        setQuery(value)
        if (isClientSide) {
            onSearchChange?.(value)
        }
    }

    const pushSearch = (nextQuery: string) => {
        if (href === ROUTES.SEARCH) {
            const params = new URLSearchParams()
            if (nextQuery) params.set('q', nextQuery)
            const qs = params.toString()
            router.push(qs ? `${ROUTES.SEARCH}?${qs}` : ROUTES.SEARCH)
        } else {
            const params = new URLSearchParams(searchParams.toString())
            if (nextQuery) {
                params.set('search', nextQuery)
            } else {
                params.delete('search')
            }
            params.delete('page')
            const qs = params.toString()
            router.push(qs ? `${ROUTES.PRODUCTS}?${qs}` : ROUTES.PRODUCTS)
        }
        onNavigate?.()
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (isClientSide) {
            return
        }
        pushSearch(query.trim())
    }

    const clearSearch = () => {
        setQuery('')
        if (isClientSide) {
            onSearchChange?.('')
        } else {
            pushSearch('')
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
                    className="pl-9 pr-10 h-10 w-full border-border transition-all duration-200"
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
