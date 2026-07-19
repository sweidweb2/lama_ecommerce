import Link from "@/components/ui/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintInvoiceButton } from "@/components/(public)/orders/PrintInvoiceButton";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { getOrderDetails } from "@/services/order.service";
import { getGuestSessionId } from "@/lib/auth/guest-session";
import { decryptOrderId } from "@/lib/utils/encryption";
import {
  formatOrderCurrency,
  formatShortOrderId,
} from "@/lib/orders/order-display";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Invoice",
  description: "Printable invoice for your order.",
};

interface InvoicePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ t?: string }>;
}

export default async function OrderInvoicePage({
  params,
  searchParams,
}: InvoicePageProps) {
  const { id: encryptedOrRawId } = await params;
  const resolvedSearchParams = await searchParams;

  let orderId = encryptedOrRawId;
  try {
    orderId = decryptOrderId(decodeURIComponent(encryptedOrRawId));
  } catch {
    // Keep raw id from URL
  }

  const user = await getCurrentAuthUserFromComponent();
  const sessionId = await getGuestSessionId();
  const accessToken =
    typeof resolvedSearchParams?.t === "string"
      ? resolvedSearchParams.t
      : null;

  const details = await getOrderDetails(
    orderId,
    user?.id ?? null,
    sessionId,
    accessToken,
  );

  if (!details) {
    notFound();
  }

  const { order, items, payment, promo_code } = details;
  const address = order.address_snapshot as {
    country?: string;
    city?: string;
    address?: string;
    postal_code?: string;
  } | null;

  const placedAt = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href={`/order_details/${order.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to order
          </Link>
        </Button>
        <PrintInvoiceButton />
      </div>

      <article className="space-y-8 rounded-xl border border-border/60 bg-background p-6 sm:p-8 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Invoice
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Aviora Wear
            </h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">
              Order #{formatShortOrderId(order.id)}
            </p>
            <p className="text-muted-foreground">Placed {placedAt}</p>
            <p className="mt-1 capitalize text-muted-foreground">
              Status: {order.status} · Payment: {order.payment_status}
            </p>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Bill to
            </h2>
            <div className="mt-2 space-y-1 text-sm">
              {order.email && <p>{order.email}</p>}
              {order.phone && <p>{order.phone}</p>}
              {address ? (
                <>
                  <p>{address.address}</p>
                  <p>
                    {address.city}
                    {address.postal_code ? `, ${address.postal_code}` : ""}
                  </p>
                  <p>{address.country}</p>
                </>
              ) : (
                <p className="text-muted-foreground">No address on file</p>
              )}
            </div>
          </div>
          {payment && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Payment
              </h2>
              <div className="mt-2 space-y-1 text-sm">
                <p className="capitalize">Status: {payment.status}</p>
                <p>Method: {payment.payment_method || "N/A"}</p>
                <p>Gateway: {payment.gateway || "N/A"}</p>
                <p>Amount: {formatOrderCurrency(payment.amount)}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Items
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Product</th>
                <th className="py-2 pr-2 font-medium">Options</th>
                <th className="py-2 pr-2 text-right font-medium">Qty</th>
                <th className="py-2 pr-2 text-right font-medium">Price</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const options = [
                  item.size_snapshot,
                  item.color_snapshot,
                  item.material_snapshot,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const lineTotal =
                  (item.price_snapshot ?? 0) * item.quantity;
                return (
                  <tr key={item.id} className="border-b border-border/40">
                    <td className="py-3 pr-2 font-medium">
                      {item.product_name_snapshot ?? "Item"}
                    </td>
                    <td className="py-3 pr-2 text-muted-foreground">
                      {options || "—"}
                    </td>
                    <td className="py-3 pr-2 text-right">{item.quantity}</td>
                    <td className="py-3 pr-2 text-right">
                      {formatOrderCurrency(item.price_snapshot)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatOrderCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatOrderCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Shipping
              {order.shipping_zone_name
                ? ` (${order.shipping_zone_name})`
                : ""}
            </span>
            <span>{formatOrderCurrency(order.shipping_fee)}</span>
          </div>
          {order.discount != null && order.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>
                Discount
                {promo_code ? ` (${promo_code})` : ""}
              </span>
              <span>-{formatOrderCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border/60 pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatOrderCurrency(order.total)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}
