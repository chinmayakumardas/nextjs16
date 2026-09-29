"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "dark") {
      setDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  function toggleTheme() {
    setDark((current) => {
      const nextTheme = !current

      if (nextTheme) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }

      return nextTheme
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
    >
      {dark ? "☀ Light" : "☾ Dark"}
    </Button>
  )
}