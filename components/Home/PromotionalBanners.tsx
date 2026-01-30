export function PromotionalBanners() {
    return (
        <section className="py-16 container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative h-[300px] rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center p-8 md:p-12 text-white">
                    <div className="max-w-[300px] z-10">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Summer Sale</span>
                        <h3 className="text-3xl font-bold mt-4">Up to 50% Off Everything</h3>
                        <p className="mt-2 text-white/80">Refresh your wardrobe with our latest collection.</p>
                        <button className="mt-6 px-6 py-2 bg-white text-indigo-600 rounded-full font-bold hover:bg-white/90 transition-colors">Shop Now</button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                </div>

                <div className="relative h-[300px] rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center p-8 md:p-12 text-white">
                    <div className="max-w-[300px] z-10">
                        <span className="bg-black/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">New Arrivals</span>
                        <h3 className="text-3xl font-bold mt-4">Premium Tech Essentials</h3>
                        <p className="mt-2 text-white/80">Experience the future of electronics today.</p>
                        <button className="mt-6 px-6 py-2 bg-black text-white rounded-full font-bold hover:bg-black/90 transition-colors">Explore</button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-black/10 rounded-full blur-3xl" />
                </div>
            </div>
        </section>
    );
}
