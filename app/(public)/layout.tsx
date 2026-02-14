import { Navbar } from "@/components/common/Navbar";
import { FloatingCartButton } from "@/components/(public)/cart/FloatingCartButton";

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex flex-col">
            {/* <Navbar /> */}
            <main className="flex-1" style={{ paddingBottom: 0, marginBottom: 0 }}>{children}</main>
            {/* Footer can be added here later */}
            <FloatingCartButton />
        </div>
    );
}
