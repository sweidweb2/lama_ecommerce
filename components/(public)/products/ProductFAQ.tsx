import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export function ProductFAQ() {
    return (
        <div className="mt-20 max-w-2xl mx-auto border-t pt-16">
            <h2 className="text-xl font-black tracking-tight mb-8 text-center uppercase tracking-widest">
                Questions & Answers
            </h2>

            <Accordion type="single" collapsible className="w-full space-y-2">
                <AccordionItem value="item-1" className="border-none bg-[#f9f9f9] rounded-2xl px-6">
                    <AccordionTrigger className="hover:no-underline py-4 text-xs font-bold uppercase tracking-wider text-left">
                        What is the shipping time for this product?
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-muted-foreground text-[10px] font-medium leading-loose">
                        Standard shipping usually takes 3-5 business days. Express shipping options are available at checkout if you need it sooner.
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-none bg-[#f9f9f9] rounded-2xl px-6">
                    <AccordionTrigger className="hover:no-underline py-4 text-xs font-bold uppercase tracking-wider text-left">
                        Is there a warranty included?
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-muted-foreground text-[10px] font-medium leading-loose">
                        Yes, every product comes with a 12-month manufacturer warranty covering any defects in materials or workmanship.
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-none bg-[#f9f9f9] rounded-2xl px-6">
                    <AccordionTrigger className="hover:no-underline py-4 text-xs font-bold uppercase tracking-wider text-left">
                        What is the return policy?
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-muted-foreground text-[10px] font-medium leading-loose">
                        We offer a 30-day hassle-free return policy. If you're not completely satisfied, you can return the product in its original packaging for a full refund.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
