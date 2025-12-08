import { redirect } from "next/navigation"
import type { Language } from "@/types"

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const validLang: Language = lang === "en" ? "en" : "es"

  // Redirect to session page - will be handled client-side
  redirect(`/${validLang}/session`)
}

export function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }]
}
