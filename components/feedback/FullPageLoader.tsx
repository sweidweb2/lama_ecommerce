'use client'

import { DNA } from 'react-loader-spinner'
import React from 'react'
import { useTheme } from 'next-themes'

export function FullPageLoader() {
    const { theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Determine if dark mode is active
    const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

    // Theme-matched loader colors
    // Light: primary brown + muted brown  |  Dark: cream + muted cream
    const colorOne = isDark ? '#E6DDD4' : '#594C39'
    const colorTwo = isDark ? '#B8A896' : '#847562'

    return (
        <div className="flex min-h-[calc(100svh-8rem)] w-full flex-1 items-center justify-center self-stretch">
            <DNA
                visible={true}
                height="220"
                width="220"
                ariaLabel="dna-loading"
                dnaColorOne={colorOne}
                dnaColorTwo={colorTwo}
            />
        </div>
    )
}
