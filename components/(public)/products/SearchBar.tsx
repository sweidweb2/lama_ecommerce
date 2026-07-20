'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/lib/constants/routes'

const LIVE_SEARCH_DEBOUNCE_MS = 350

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
    const urlQuery =
        searchParams.get(queryParam) ||
        searchParams.get('search') ||
        searchParams.get('q') ||
        ''
    const [query, setQuery] = useState(urlQuery)
    const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    if (urlQuery !== prevUrlQuery) {
        setPrevUrlQuery(urlQuery)
        setQuery(urlQuery)
    }

    // If onSearchChange is provided, use client-side filtering
    const isClientSide = !!onSearchChange
    // Catalog search should update the URL as the user types (server-side filter)
    const isLiveCatalogSearch = !isClientSide && href === ROUTES.PRODUCTS

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

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    // Notify parent when URL-driven query changes (no setState here)
    useEffect(() => {
        onSearchChange?.(urlQuery)
    }, [urlQuery, onSearchChange])

    const pushSearch = (nextQuery: string) => {
        const trimmed = nextQuery.trim()

        if (href === ROUTES.SEARCH) {
            const params = new URLSearchParams()
            if (trimmed) params.set('q', trimmed)
            const qs = params.toString()
            router.push(qs ? `${ROUTES.SEARCH}?${qs}` : ROUTES.SEARCH)
        } else {
            const current = (searchParams.get('search') || '').trim()
            if (trimmed === current) return

            const params = new URLSearchParams(searchParams.toString())
            if (trimmed) {
                params.set('search', trimmed)
            } else {
                params.delete('search')
            }
            params.delete('page')
            const qs = params.toString()
            router.push(qs ? `${ROUTES.PRODUCTS}?${qs}` : ROUTES.PRODUCTS)
        }
        onNavigate?.()
    }

    const scheduleLiveSearch = (nextQuery: string) => {
        if (!isLiveCatalogSearch) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            pushSearch(nextQuery)
        }, LIVE_SEARCH_DEBOUNCE_MS)
    }

    const handleChange = (value: string) => {
        setQuery(value)
        if (isClientSide) {
            onSearchChange?.(value)
        } else {
            scheduleLiveSearch(value)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (isClientSide) {
            return
        }
        if (debounceRef.current) clearTimeout(debounceRef.current)
        pushSearch(query)
    }

    const clearSearch = () => {
        setQuery('')
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (isClientSide) {
            onSearchChange?.('')
        } else {
            pushSearch('')
        }
    }

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <div className="relative group">
                <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                    aria-label="Search products"
                >
                    <Search className="h-4 w-4" />
                </button>
                <Input
                    id="product-search"
                    type="text"
                    placeholder="Search products... (Press / to focus)"
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    className="pl-9 pr-10 h-10 w-full border-border transition-all duration-200"
                    autoComplete="off"
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
        </form>
    )
}
