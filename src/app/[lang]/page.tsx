import { redirect } from "next/navigation"
import type { Language } from "@/types"
import type { Metadata } from "next"

export async function generateMetadata(
  { params }: { params: { lang: string } }
): Promise<Metadata> {
  const lang: Language = params.lang === "en" ? "en" : "es"

  if (lang === "en") {
    return {
      title: "Masaniello Management",
      description: "Manage your Masaniello strategy and progressive cycles"
    }
  }

  return {
    title: "Gestión Masaniello",
    description: "Administra tu estrategia Masaniello y ciclos progresivos"
  }
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const validLang: Language = lang === "en" ? "en" : "es"
  

  // Redirect to session page - will be handled client-side
  redirect(`/${validLang}/session`)
}

export function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }]
}
