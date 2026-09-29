"use client"

import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"

import ProductCard from "./product-card"

export default function ProductSearch({ products }) {
  const [search, setSearch] = useState("")

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) {
      return products
    }

    return products.filter((product) =>
      product.title.toLowerCase().includes(value)
    )
  }, [products, search])

  return (
    <div>
      <div className="mb-6 max-w-sm">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border bg-background p-12 text-center">
          <p className="font-medium">
            No products found
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Try searching for another product.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  )
}