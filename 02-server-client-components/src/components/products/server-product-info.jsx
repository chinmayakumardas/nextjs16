import "server-only"

export default function ServerProductInfo() {
  const supplier =
    process.env.SUPPLIER_NAME || "Aditya Suppliers"

  const inventory =
    process.env.INTERNAL_INVENTORY || "42"

  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold">
          Server Information
        </p>

        <p className="text-xs text-muted-foreground">
          Rendered by the Server Component
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Inventory
          </p>

          <p className="mt-1 font-semibold">
            {inventory}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Supplier
          </p>

          <p className="mt-1 font-semibold">
            {supplier}
          </p>
        </div>
      </div>
    </div>
  )
}