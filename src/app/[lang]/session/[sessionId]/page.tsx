import { SessionPage } from "@/components/session-page"
import type { Language } from "@/types"

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; sessionId: string }>
}) {
  const { lang, sessionId } = await params
  const validLang: Language = lang === "en" ? "en" : "es"

  return <SessionPage lang={validLang} sessionId={sessionId} />
}
