"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

export default function FavoriteButton() {
  const [favorite, setFavorite] = useState(false)

  function handleFavorite() {
    setFavorite((current) => !current)
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleFavorite}
      className="rounded-full bg-white/95 shadow-md backdrop-blur hover:bg-white"
    >
      {favorite ? "♥ Favorited" : "♡ Favorite"}
    </Button>
  )
}