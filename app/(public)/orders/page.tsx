import { OrdersTable } from "@/components/(public)/orders/OrdersTable";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { getUserOrders, getSessionOrders } from "@/services/order.service";
import { getGuestSessionId } from "@/lib/auth/guest-session";
import { encryptOrderId } from "@/lib/utils/encryption";
import Link from "@/components/ui/link";
import { ROUTES } from "@/lib/constants/routes";

export const metadata = {
  title: "My Orders",
  description: "View your order history and track your purchases.",
};

export default async function OrdersPage() {
  // Check if the user is authenticated
  const user = await getCurrentAuthUserFromComponent();

  let orders;

  if (user) {
    // Authenticated → fetch orders by user_id
    orders = await getUserOrders(user.id);
  } else {
    // Guest → read session cookie and fetch orders by session_id
    const sessionId = await getGuestSessionId();

    orders = sessionId ? await getSessionOrders(sessionId) : [];
  }

  const ordersWithEncryptedIds = orders.map((order) => ({
    ...order,
    encryptedId: encryptOrderId(order.id),
  }));

  return (
    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            My Orders
          </h1>
          <p className="text-muted-foreground mt-2">
            View and track all your orders.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Can&apos;t find your order?{" "}
          <Link
            href={ROUTES.ORDERS_FIND}
            className="text-primary font-medium hover:underline"
          >
            Look it up by email
          </Link>
        </p>
      </div>

      <OrdersTable orders={ordersWithEncryptedIds} />
    </div>
  );
}
