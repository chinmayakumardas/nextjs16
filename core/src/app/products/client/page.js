"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
  <>
    <h1>
      Cleint component
    </h1>
      <button className="rounded-3xl bg-red-500 text-3xl p-5 w-[200px] mx-auto my-auto" onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  </>
  );
}