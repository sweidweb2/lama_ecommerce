import { CreateCartDialog } from "@/components/admin/cart/create_form"
import { CartsTable } from "@/components/admin/cart/CartsTable"
import { listCartsForAdminService } from "@/services/cart.service"
import { encryptOrderId } from "@/lib/utils/encryption"

const CARTS_PAGE_SIZE = 20

interface CartsPageProps {
  searchParams: Promise<{
    page?: string
    q?: string
  }>
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const n = Number.parseInt(value ?? "", 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export default async function CartsPage({ searchParams }: CartsPageProps) {
  const params = await searchParams
  const q = params.q?.trim() ?? ""
  const listResult = await listCartsForAdminService({
    page: parsePositiveInt(params.page, 1),
    pageSize: CARTS_PAGE_SIZE,
    q: q || undefined,
  })

  const cartsWithEncryptedIds = listResult.items.map((cart) => ({
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

      <CartsTable
        carts={cartsWithEncryptedIds}
        totalCount={listResult.total}
        page={listResult.page}
        pageSize={listResult.pageSize}
        query={q}
      />
    </div>
  )
}
