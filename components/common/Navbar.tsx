"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import {
    ShoppingCart,
    User,
    Menu,
    Search,
    Heart
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
    { label: "Home", href: ROUTES.HOME },
    { label: "Products", href: "/products" },
    { label: "Categories", href: "/categories" },
    { label: "About", href: "/about" },
];

export function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Link href={ROUTES.HOME} className="flex items-center space-x-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                LAMA
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "transition-colors hover:text-primary",
                                    pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Button variant="ghost" size="icon" className="hidden sm:flex">
                            <Search className="h-5 w-5" />
                            <span className="sr-only">Search</span>
                        </Button>

                        <Link href="/wishlist">
                            <Button variant="ghost" size="icon" className="hidden sm:flex">
                                <Heart className="h-5 w-5" />
                                <span className="sr-only">Wishlist</span>
                            </Button>
                        </Link>

                        <Link href={ROUTES.CART}>
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="h-5 w-5" />
                                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                                <span className="sr-only">Cart</span>
                            </Button>
                        </Link>

                        <Link href={ROUTES.LOGIN}>
                            <Button variant="ghost" size="icon">
                                <User className="h-5 w-5" />
                                <span className="sr-only">Account</span>
                            </Button>
                        </Link>

                        {/* Mobile Menu */}
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Toggle Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                                <SheetHeader>
                                    <SheetTitle className="text-left font-bold text-2xl">LAMA</SheetTitle>
                                </SheetHeader>
                                <nav className="flex flex-col gap-4 mt-8">
                                    {NAV_LINKS.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "text-lg font-medium transition-colors hover:text-primary",
                                                pathname === link.href ? "text-primary" : "text-muted-foreground"
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                    <hr className="my-2" />
                                    <div className="flex flex-col gap-2">
                                        <Link href={ROUTES.LOGIN} onClick={() => setIsOpen(false)}>
                                            <Button className="w-full justify-start" variant="ghost">
                                                Sign In
                                            </Button>
                                        </Link>
                                        <Link href={ROUTES.SIGNUP} onClick={() => setIsOpen(false)}>
                                            <Button className="w-full justify-start">
                                                Sign Up
                                            </Button>
                                        </Link>
                                    </div>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
