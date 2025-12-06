"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useTradingStore } from "@/stores/store"
import { translations } from "@/lib/translations"
import type { Language } from "@/types"
import { useEffect } from "react"

interface HeaderProps {
  lang: Language
}

export function Header({ lang }: HeaderProps) {
  const { theme, setTheme } = useTradingStore()
  const t = translations[lang]
  const alternateLang = lang === "es" ? "en" : "es"

  useEffect(() => {
    const root = document.documentElement

    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.toggle("dark", systemDark)

      const listener = (e: MediaQueryListEvent) => {
        root.classList.toggle("dark", e.matches)
      }
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", listener)
      return () => {
        window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", listener)
      }
    } else {
      root.classList.toggle("dark", theme === "dark")
    }
  }, [theme])

  const cycleTheme = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"]
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Image src="/images/logo.png" alt="Masaniello Logo" width={48} height={48} className="rounded-lg" />
        <h1 className="text-3xl font-bold text-primary">{t.title}</h1>
      </div>
      <div className="flex gap-2">
        <Link href={`/${alternateLang}`}>
          <Button variant="outline" size="sm" className="h-9 px-3 bg-transparent font-semibold">
            {alternateLang.toUpperCase()}
          </Button>
        </Link>
        <Button onClick={cycleTheme} variant="outline" size="icon" className="h-9 w-9 bg-transparent" title={theme}>
          <ThemeIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
