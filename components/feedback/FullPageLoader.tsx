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
    
    // Set loader colors based on theme
    // Light theme: black, Dark theme: white
    const loaderColors = isDark 
        ? ['#ffffff', '#ffffff', '#ffffff'] // White for dark mode
        : ['#000000', '#000000', '#000000'] // Black for light mode

    return (
        <div className="flex items-center justify-center h-screen w-screen">
            <div className="w-full h-full">
                <DNA
                    visible={true}
                    height="100%"
                    width="100%"
                    ariaLabel="dna-loading"
                    wrapperStyle={{}}
                    wrapperClass="w-full h-full"
                    colors={loaderColors}
                />
            </div>
        </div>
    )
}