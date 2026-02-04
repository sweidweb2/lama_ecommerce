import { Truck, ShieldCheck, RotateCcw } from 'lucide-react'

export function ProductTrustInfo() {
    return (
        <div className="flex flex-col gap-4 pt-4 h-full justify-between">
            <div className="bg-[#f9f9f9] p-6 rounded-[2.5rem] text-center space-y-3 flex-1">
                <Truck className="h-8 w-8 mx-auto text-primary opacity-70" />
                <p className="text-sm font-black uppercase tracking-tighter">
                    Fast Shipping
                </p>
            </div>
            <div className="bg-[#f9f9f9] p-6 rounded-[2.5rem] text-center space-y-3 flex-1">
                <ShieldCheck className="h-8 w-8 mx-auto text-primary opacity-70" />
                <p className="text-sm font-black uppercase tracking-tighter">
                    Security Pay
                </p>
            </div>
            <div className="bg-[#f9f9f9] p-6 rounded-[2.5rem] text-center space-y-3 flex-1">
                <RotateCcw className="h-8 w-8 mx-auto text-primary opacity-70" />
                <p className="text-sm font-black uppercase tracking-tighter">
                    30-Day returns
                </p>
            </div>
        </div>
    )
}
