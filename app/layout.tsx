import './globals.css'
import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import AppShell from '@/components/AppShell'

export const metadata = {
  title: 'SoloPro',
  description: 'Agenda & Facturation pour micro-entrepreneurs'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
