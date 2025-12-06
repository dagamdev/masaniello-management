import { TradingTracker } from "@/components/trading-tracker"
import type { Language } from "@/lib/translations"

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const validLang: Language = lang === "en" ? "en" : "es"

  return (
    <main className="min-h-screen p-4 md:p-8">
      <TradingTracker lang={validLang} />
    </main>
  )
}

export function generateStaticParams() {
  return [{ lang: "es" }, { lang: "en" }]
}
