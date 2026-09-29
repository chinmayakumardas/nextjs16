import ProductCard from "@/components/products/product-card"

async function getProducts() {
  const response = await fetch(
    "https://dummyjson.com/products",
    {
      next: {
        revalidate: 60,
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to fetch products")
  }

  const data = await response.json()

  return data.products
}

export default async function ProductsPage() {
  const products = await getProducts()

  const averagePrice =
    products.reduce((sum, product) => sum + product.price, 0) /
    products.length

  const totalStock = products.reduce(
    (sum, product) => sum + product.stock,
    0
  )

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              P
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-950">
                Productly
              </p>

              <p className="hidden text-xs text-slate-400 sm:block">
                Product Dashboard
              </p>
            </div>
          </div>

          <div className="rounded-full border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            Dashboard
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-6 lg:px-8">
        {/* Page Heading */}
        <section className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Product Catalog
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Products
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Browse the latest products available in your catalog.
          </p>
        </section>

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Products
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {products.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Products in catalog
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Average Price
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              ${averagePrice.toFixed(2)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Across all products
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Stock
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {totalStock}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Units available
            </p>
          </div>
        </section>

        {/* Products Header */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                All Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing {products.length} products
              </p>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}