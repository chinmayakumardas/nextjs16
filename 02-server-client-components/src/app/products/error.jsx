"use client"

export default function Error({ reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          Something went wrong
        </h1>

        <p className="mt-2 text-muted-foreground">
          We couldn't load the products.
        </p>

        <button
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </main>
  )
}