import "server-only"

const PRODUCTS_API =
  "https://dummyjson.com/products?limit=30"

export async function getProducts() {
  const response = await fetch(PRODUCTS_API, {
    next: {
      revalidate: 60,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch products")
  }

  const data = await response.json()

  return data.products
}