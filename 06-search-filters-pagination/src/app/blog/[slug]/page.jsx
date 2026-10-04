export default async function BlogPost({ params, searchParams }) {
  const { slug } = await params;

  const {
    query,
    category,
    page,
  } = await searchParams;

  return (
    <main>
      <h1>Blog</h1>

      <p>Slug: {slug}</p>
      <p>Search: {query}</p>
      <p>Category: {category}</p>
      <p>Page: {page}</p>
    </main>
  );
}