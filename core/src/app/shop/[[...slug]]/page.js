// File:
// app/shop/[[...slug]]/page.js

export default async function Page({ params }) {
  // /shop
  // params.slug = undefined

  // /shop/shoes
  // params.slug = ["shoes"]

  // /shop/shoes/nike
  // params.slug = ["shoes", "nike"]

  // /shop/shoes/nike/air-max
  // params.slug = ["shoes", "nike", "air-max"]

  const { slug = [] } = await params;

  return (
    <div>
      <h1>Shop</h1>

      <p>Total levels: {slug.length}</p>

      {/* Show every URL segment */}
      {slug.map((item, index) => (
        <p key={index}>
          Level {index + 1}: {item}
        </p>
      ))}
    </div>
  );
}