"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useMasanielloStore } from "@/stores/masaniello-store"
import type { Language } from "@/types"

export default function SessionRedirect() {
  const params = useParams()
  const lang = params.lang as string
  const validLang: Language = lang === "en" ? "en" : "es"
  const router = useRouter()
  const { sessions, activeSessionId } = useMasanielloStore()

  useEffect(() => {
    if (sessions.length > 0) {
      const targetId = activeSessionId || sessions[0].id
      console.log({targetId})
      router.replace(`/${validLang}/session/${targetId}`)
    }
  }, [sessions, activeSessionId, validLang, router])

  return (
    <div className="min-h-screen flex items-center justify-center c">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  )
}
