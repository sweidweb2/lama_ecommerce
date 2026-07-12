import Link from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { HomeIcon, SearchIcon, FileQuestionIcon } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-md text-center space-y-6">
        {/* 404 Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <FileQuestionIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        {/* 404 Content */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Error 404</p>
          <h1 className="text-4xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href={ROUTES.HOME}>
              <HomeIcon className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/products">
              <SearchIcon className="h-4 w-4 mr-2" />
              Browse Products
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-3">You might be looking for:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href={ROUTES.HOME}
              className="text-sm text-primary hover:underline"
            >
              Home
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href="/products"
              className="text-sm text-primary hover:underline"
            >
              Products
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href={ROUTES.CART}
              className="text-sm text-primary hover:underline"
            >
              Cart
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              href={ROUTES.LOGIN}
              className="text-sm text-primary hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
