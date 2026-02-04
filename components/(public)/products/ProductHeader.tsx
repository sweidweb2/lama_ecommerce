interface ProductHeaderProps {
    categoryName?: string
    productName: string
}

export function ProductHeader({ categoryName, productName }: ProductHeaderProps) {
    return (
        <div className="space-y-1">
            <p className="text-primary font-bold text-[10px] uppercase tracking-widest opacity-70">
                {categoryName || 'Collection'}
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
                {productName}
            </h1>
        </div>
    )
}
