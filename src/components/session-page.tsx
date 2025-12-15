"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMasanielloStore } from "@/stores/masaniello-store"
import { Header } from "@/components/trading/header"
import { SessionManager } from "@/components/trading/session-manager"
import { ConfigPanel } from "@/components/trading/config-panel"
import { ObjectivePanel } from "@/components/trading/objective-panel"
import { InfoPanel } from "@/components/trading/info-panel"
import { ObjectiveInfoPanel } from "@/components/trading/objective-info-panel"
import { OperationsTable } from "@/components/trading/operations-table"
import type { Language } from "@/types"

interface SessionPageProps {
  lang: Language
  sessionId: string
}

export function SessionPage({ lang, sessionId }: SessionPageProps) {
  const router = useRouter()
  const { sessions, activeSessionId, setActiveSession, initializeStore } = useMasanielloStore()

  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  useEffect(() => {
    if (sessions.length > 0) {
      const sessionExists = sessions.some((s) => s.id === sessionId)
      if (sessionExists && activeSessionId !== sessionId) {
        setActiveSession(sessionId)
      } else if (!sessionExists && sessions.length > 0) {
        router.replace(`/${lang}/session/${sessions[0].id}`)
      }
    }
  }, [sessionId, sessions, activeSessionId, setActiveSession, lang, router])

  const activeSession = sessions.find((s) => s.id === sessionId)

  if (!activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4">
        <Header lang={lang} sessionId={sessionId} />
        <SessionManager lang={lang} sessionId={sessionId} />

        <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
          <div className="order-1 lg:order-2 lg:flex-1">
            <OperationsTable lang={lang} />
          </div>

          <div className="order-2 lg:order-1 lg:w-72 xl:w-80 space-y-2 sm:space-y-3">
            <div className="sm:hidden">
              <ConfigPanel lang={lang} />
            </div>

            <div className="sm:hidden">
              <ObjectiveInfoPanel lang={lang} />
            </div>

            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
              <ConfigPanel lang={lang} />
              <ObjectivePanel lang={lang} />
            </div>
            <div className="hidden lg:block">
              <InfoPanel lang={lang} />
            </div>
          </div>
        </div>

        <div className="hidden sm:block lg:hidden">
          <InfoPanel lang={lang} />
        </div>
      </div>
    </main>
  )
}
