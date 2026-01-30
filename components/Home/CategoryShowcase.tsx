export function CategoryShowcase() {
    const categories = [
        { name: "Electronics", count: "1,200 Products" },
        { name: "Fashion", count: "850 Products" },
        { name: "Home & Garden", count: "430 Products" },
        { name: "Beauty", count: "210 Products" },
    ];

    return (
        <section className="py-16 bg-muted/50">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold tracking-tight mb-8 text-center uppercase italic">Shop by Category</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat) => (
                        <div key={cat.name} className="relative aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer">
                            <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                <h3 className="text-2xl font-bold">{cat.name}</h3>
                                <p className="text-white/80 text-sm mt-1">{cat.count}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
