import { Navbar } from "@/components/common/Navbar";

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            {/* Footer can be added here later */}
        </div>
    );
}
