import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ProductCard({ product }) {
  return (
    <Card className="group overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <Badge className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-white">
          {product.category}
        </Badge>
      </div>

      <CardContent className="p-4">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {product.title}
            </h2>

            <p className="mt-1 truncate text-xs text-slate-400">
              {product.brand || "Premium Collection"}
            </p>
          </div>

          <span className="shrink-0 text-sm font-bold text-slate-900">
            ${product.price}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
          {product.description}
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-600">
            ★ {product.rating}
          </span>

          <span className="text-xs text-slate-400">
            {product.stock} in stock
          </span>
        </div>
      </CardContent>
    </Card>
  )
}