import { cookies } from "next/headers";
import { OrdersTable } from "@/components/(public)/orders/OrdersTable";
import { getCurrentAuthUserFromComponent } from "@/repositories/auth.repository";
import { getUserOrders, getSessionOrders } from "@/services/order.service";

export const metadata = {
  title: "My Orders | LAMA",
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
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("guest_session_id")?.value;

    orders = sessionId ? await getSessionOrders(sessionId) : [];
  }

  return (
    <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          My Orders
        </h1>
        <p className="text-muted-foreground mt-2">
          View and track all your orders.
        </p>
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
}
