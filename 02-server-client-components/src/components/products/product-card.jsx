import Image from "next/image"

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import FavoriteButton from "./favorite-button"
import ProductPreview from "./product-preview"

export default function ProductCard({ product }) {
  return (
    <Card className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="
            (max-width: 640px) 100vw,
            (max-width: 1024px) 50vw,
            20vw
          "
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <Badge className="absolute left-3 top-3">
          {product.category}
        </Badge>

        {/* Favorite */}
        <div className="absolute right-3 top-3">
          <FavoriteButton />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">
              {product.title}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {product.brand || "Premium Collection"}
            </p>
          </div>

          <p className="shrink-0 text-lg font-bold">
            ${product.price}
          </p>

        </div>
      </CardHeader>

      <CardContent>
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between border-t pt-4">

          <span className="text-sm font-medium">
            ★ {product.rating}
          </span>

          <span className="text-xs text-muted-foreground">
            {product.stock} in stock
          </span>

        </div>

        <div className="mt-4">
          <ProductPreview product={product} />
        </div>
      </CardContent>

    </Card>
  )
}