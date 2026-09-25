// app/products/page.js
//server components
// export default async function Page() {
//   const products = await fetch("https://api.example.com/products")
//     .then(res => res.json());

//   return (
//     <div>
//       <h1>Products</h1>

//       {products.map(product => (
//         <div key={product.id}>
//           {product.name}
//         </div>
//       ))}
//     </div>
//   );
// }


import AddToCart from "./AddToCart";

export default async function Page() {
  const product = await getProduct();

  return (
    <div>
      <h1>{product.name}</h1>

      <AddToCart productId={product.id} />
    </div>
  );
}