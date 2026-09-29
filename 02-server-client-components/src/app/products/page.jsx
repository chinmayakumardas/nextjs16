import ProductSearch from "@/components/products/product-search"
import ServerProductInfo from "@/components/products/server-product-info"
import ThemeToggle from "@/components/theme/theme-toggle"

import { getProducts } from "@/lib/products"

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <main className="min-h-screen bg-muted/30">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              P
            </div>

            <div>
              <p className="text-sm font-semibold">
                Productly
              </p>

              <p className="hidden text-xs text-muted-foreground sm:block">
                Product Dashboard
              </p>
            </div>
          </div>

          <ThemeToggle />

        </div>
      </header>

      {/* Page */}
      <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-6 lg:px-8">

        {/* Hero */}
        <section className="mb-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Dashboard
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Products
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Browse, search, and preview products from your catalog.
              </p>
            </div>

            <div className="rounded-xl border bg-background px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">
                Total Products
              </p>

              <p className="mt-1 text-xl font-bold">
                {products.length}
              </p>
            </div>

          </div>
        </section>

        {/* Server-only information */}
        <section className="mb-8">
          <ServerProductInfo />
        </section>

        {/* Product Search */}
        <section>

          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Product Catalog
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Find a product by name.
            </p>
          </div>

          <ProductSearch products={products} />

        </section>

      </div>

    </main>
  )
}