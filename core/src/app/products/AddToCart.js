"use client";

import { useState } from "react";

export default function AddToCart({ productId }) {
  const [added, setAdded] = useState(false);

  return (
    <button onClick={() => setAdded(true)}>
      {added ? "Added" : "Add to Cart"}
    </button>
  );
}