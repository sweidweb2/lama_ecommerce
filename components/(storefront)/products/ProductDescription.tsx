interface ProductDescriptionProps {
    description?: string
    className?: string
}

export function ProductDescription({ description, className = '' }: ProductDescriptionProps) {
    return (
        <div className={`space-y-2 py-4 border-t border-black/5 ${className}`}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                About this product
            </h3>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base font-medium max-w-2xl mx-auto lg:mx-0">
                {description || 'Premium quality materials and contemporary design combine to create this essential piece for your collection.'}
            </p>
        </div>
    )
}
