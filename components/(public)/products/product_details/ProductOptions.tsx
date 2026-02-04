// Helper function to convert color name to hex/rgb
function getColorValue(colorName: string): string {
    const colorMap: Record<string, string> = {
        'red': '#ef4444',
        'blue': '#3b82f6',
        'green': '#22c55e',
        'yellow': '#eab308',
        'black': '#000000',
        'white': '#ffffff',
        'gray': '#6b7280',
        'grey': '#6b7280',
        'purple': '#a855f7',
        'pink': '#ec4899',
        'orange': '#f97316',
        'brown': '#92400e',
        'navy': '#1e3a8a',
        'beige': '#f5f5dc',
        'tan': '#d2b48c',
    }
    
    const normalized = colorName.toLowerCase().trim()
    return colorMap[normalized] || '#6b7280' // default gray if not found
}

interface ProductOptionsProps {
    colors?: string[]
    sizes?: string[]
    className?: string
}

export function ProductOptions({ colors = [], sizes = [], className = '' }: ProductOptionsProps) {
    return (
        <div className={`flex flex-col md:flex-row gap-8 pt-8 h-full ${className}`}>
            {colors.length > 0 && (
                <div className="space-y-5 flex-1 flex flex-col">
                    <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        Select Color
                    </label>
                    <div className="flex flex-wrap gap-4 flex-1">
                        {colors.map((color) => {
                            const colorValue = getColorValue(color)
                            return (
                                <button
                                    key={color}
                                    className="flex items-center gap-3 px-6 py-4 border-2 rounded-2xl text-base font-bold hover:border-primary transition-all active:scale-95 whitespace-nowrap bg-white dark:bg-card h-fit"
                                >
                                    <div 
                                        className="w-8 h-8 rounded-full border-2 border-black/10"
                                        style={{ backgroundColor: colorValue }}
                                    />
                                    <span>{color}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {sizes.length > 0 && (
                <div className="space-y-5 flex-1 flex flex-col">
                    <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        Select Size
                    </label>
                    <div className="flex flex-wrap gap-4 flex-1">
                        {sizes.map((size) => (
                            <button
                                key={size}
                                className="w-16 h-16 flex items-center justify-center border-2 rounded-2xl text-base font-bold hover:border-primary transition-all active:scale-95 bg-white dark:bg-card"
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
