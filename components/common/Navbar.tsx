'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "../../lib/constants/routes";
import { ROLES } from "../../lib/constants/roles";
import { Button } from "../ui/button";
import {
  ShoppingCart,
  User,
  Menu,
  Search,
  Heart,
  LayoutDashboard,
  Settings,
  LogOut,
  Package,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useState } from "react";
import { cn } from "../../lib/utils";
import React from "react";
import { ModeToggle } from "../theme/mode-toggle";
import { useAuth } from "@/providers/AuthProvider";
import { logoutService } from "@/services/auth.service";
import { toast } from "sonner";

const NAV_LINKS = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Products", href: "/products" },
  { label: "Orders", href: "/orders" },
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/contact-us" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, profile, role, loading } = useAuth();

  // Hide navbar on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Check if user is admin
  const isAdmin = role === ROLES.ADMIN && user !== null;
  const isLoggedIn = user !== null && !loading;

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const result = await logoutService();

      if (!result.success) {
        toast.error("Logout failed", {
          description: result.error,
        });
        return;
      }

      toast.success("Logged out successfully");
      router.push(ROUTES.HOME);
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href={ROUTES.HOME} className="flex items-center">
              <Image
                src="/lama_logo.jpg"
                alt="Lama logo"
                width={40}
                height={40}
                priority
                className="h-8 w-auto rounded-md object-cover sm:h-9"
              />
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
                  pathname === link.href
                    ? "text-primary font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href={ROUTES.ADMIN}
                className={cn(
                  "transition-colors hover:text-primary flex items-center gap-2",
                  pathname === ROUTES.ADMIN
                    ? "text-primary font-semibold"
                    : "text-muted-foreground",
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
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

            <div className="hidden md:flex items-center gap-2">
              <ModeToggle />
            </div>

            <Link href={ROUTES.CART} className="hidden md:block">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                <span className="sr-only">Cart</span>
              </Button>
            </Link>

            {/* User Menu - Show when logged in */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative hidden md:flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-background hover:border-primary/50 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-semibold">
                      {getUserInitials()}
                    </div>
                    <span className="sr-only">Open user menu</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getUserDisplayName()}
                      </p>
                      {user?.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/account/settings"
                      className="flex items-center cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={ROUTES.ADMIN}
                        className="flex items-center cursor-pointer"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Login/Signup buttons - Show when not logged in */
              <div className="hidden md:flex items-center gap-2">
                <Link href={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href={ROUTES.SIGNUP}>
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="px-4">
                  <SheetTitle className="flex justify-start">
                    <Image
                      src="/lama_logo.jpg"
                      alt="Lama logo"
                      width={36}
                      height={36}
                      className="h-8 w-auto rounded-md object-cover"
                    />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8 px-4">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary",
                        pathname === link.href
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href={ROUTES.ADMIN}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-lg font-medium transition-colors hover:text-primary flex items-center gap-2",
                        pathname === ROUTES.ADMIN
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  )}
                  <hr className="my-2" />
                  <Link
                    href={ROUTES.CART}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Cart
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                    Wishlist
                  </Link>
                  <div
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-lg font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <Search className="h-5 w-5" />
                    Search
                  </div>
                  <hr className="my-2" />
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">Theme</span>
                    <ModeToggle />
                  </div>
                  <hr className="my-2" />
                  {isLoggedIn ? (
                    <div className="flex flex-col gap-2">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">
                          {getUserDisplayName()}
                        </p>
                        {user?.email && (
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                      <hr className="my-2" />
                      <Link href="/account" onClick={() => setIsOpen(false)}>
                        <Button className="w-full justify-start" variant="ghost">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/orders" onClick={() => setIsOpen(false)}>
                        <Button className="w-full justify-start" variant="ghost">
                          <Package className="mr-2 h-4 w-4" />
                          Orders
                        </Button>
                      </Link>
                      <Link
                        href="/account/settings"
                        onClick={() => setIsOpen(false)}
                      >
                        <Button className="w-full justify-start" variant="ghost">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Link
                          href={ROUTES.ADMIN}
                          onClick={() => setIsOpen(false)}
                        >
                          <Button
                            className="w-full justify-start"
                            variant="ghost"
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      <hr className="my-2" />
                      <Button
                        className="w-full justify-start"
                        variant="ghost"
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link href={ROUTES.LOGIN} onClick={() => setIsOpen(false)}>
                        <Button className="w-full justify-start" variant="ghost">
                          Sign In
                        </Button>
                      </Link>
                      <Link
                        href={ROUTES.SIGNUP}
                        onClick={() => setIsOpen(false)}
                      >
                        <Button className="w-full justify-start">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

