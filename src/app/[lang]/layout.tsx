import { MasanielloProvider } from '@/providers/masaniello-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <MasanielloProvider>
      {children}
    </MasanielloProvider>
  )
}
