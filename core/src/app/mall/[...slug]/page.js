// File:
// app/mall/[...slug]/page.js

export default async function Page({ params }) {
  // Example URL:
  // /mall/shoes
  // params.slug = ["shoes"]

  // Example URL:
  // /mall/shoes/nike
  // params.slug = ["shoes", "nike"]

  // Example URL:
  // /mall/shoes/nike/air-max
  // params.slug = ["shoes", "nike", "air-max"]

  const { slug } = await params;

  return (
    <div>
      <h1>Mall</h1>

      {/* Show every URL segment */}
      {slug.map((item, index) => (
        <p key={index}>
          Level {index + 1}: {item}
        </p>
      ))}
    </div>
  );
}

// ❌ /mall
// Does NOT work because [ ...slug ] needs at least one segment.