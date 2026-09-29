"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

export default function ProductPreview({ product }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          Open Preview
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {product.title}
          </DialogTitle>

          <DialogDescription>
            Product preview
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">

          <div>
            <p className="text-2xl font-bold">
              ${product.price}
            </p>
          </div>

          <div>
            <p className="text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}