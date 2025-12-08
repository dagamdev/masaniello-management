"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { translations } from "@/lib/translations"
import type { Language } from "@/types"
import { useEffect, useState } from "react"

interface HeaderProps {
  lang: Language
  sessionId: string
}

export function Header({ lang, sessionId }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const t = translations[lang]
  const alternateLang = lang === "es" ? "en" : "es"

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <Image
          src="/images/logo.png"
          alt="Masaniello Logo"
          width={48}
          height={48}
          className="rounded-lg w-10 h-10 sm:w-12 sm:h-12"
        />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary leading-tight">{t.title}</h1>
      </div>
      <div className="flex gap-2 self-end sm:self-auto">
        <Link href={`/${alternateLang}/session/${sessionId}`}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 px-2 sm:px-3 bg-transparent font-semibold text-xs sm:text-sm"
          >
            {alternateLang.toUpperCase()}
          </Button>
        </Link>
        <Button onClick={toggleTheme} variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 bg-transparent">
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  )
}
