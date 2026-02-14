export default async function CartDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cart Details</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            View and manage cart information
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cart details page - Coming soon</p>
          <p className="text-sm text-muted-foreground mt-2">Cart ID: {id}</p>
        </div>
      </div>
    </div>
  );
}
