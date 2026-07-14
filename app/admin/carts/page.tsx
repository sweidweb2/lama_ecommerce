import { CreateCartDialog } from "@/components/admin/cart/create_form"
import { CartsTable } from "@/components/admin/cart/CartsTable"
import { getAllCartsForAdminService } from "@/services/cart.service"
import { encryptOrderId } from "@/lib/utils/encryption"

export default async function CartsPage() {
  const carts = await getAllCartsForAdminService()
  const cartsWithEncryptedIds = carts.map((cart) => ({
    ...cart,
    encryptedId: encryptOrderId(cart.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Carts</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            View and manage user shopping carts
          </p>
        </div>
        <CreateCartDialog />
      </div>

      <CartsTable carts={cartsWithEncryptedIds} />
    </div>
  )
}
