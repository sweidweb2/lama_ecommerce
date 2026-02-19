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
        <div className="flex items-center justify-center h-screen w-screen">
            <div className="w-full h-full">
                <DNA
                    visible={true}
                    height="100"
                    width="100"
                    ariaLabel="dna-loading"
                    dnaColorOne={colorOne}
                    dnaColorTwo={colorTwo}
                    wrapperStyle={{}}
                    wrapperClass="w-full h-full flex items-center justify-center"
                />
            </div>
        </div>
    )
}