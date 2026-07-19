import type { Metadata } from "next";
import Link from "next/link";
import { UnsubscribeClient } from "@/components/(public)/unsubscribe/UnsubscribeClient";
import { ROUTES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Leave the Aviora Wear email list.",
};

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const params = await searchParams;
  const token = (params.token || "").trim();

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Unsubscribe</h1>
        <p className="text-muted-foreground mb-8">
          Leave our email list. You can join again anytime from the site footer.
        </p>
        <UnsubscribeClient token={token} />
        <p className="mt-8 text-sm text-muted-foreground">
          <Link href={ROUTES.HOME} className="text-primary hover:underline">
            Back to home
          </Link>
        </p>
      </section>
    </div>
  );
}
