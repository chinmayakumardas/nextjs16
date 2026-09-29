"use client"

import { Button } from "@/components/ui/button"

export default function Error({ reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't load the product catalog.
        </p>

        <Button
          onClick={() => reset()}
          className="mt-6"
        >
          Try again
        </Button>
      </div>
    </main>
  )
}