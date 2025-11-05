'use client'

import React from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

type AppShellProps = {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="container">
      <div className="app-shell">
        <header className="app-header">
          <div className="app-logo">
            <span className="app-logo-title">SoloPro</span>
            <span className="app-logo-subtitle">
              Agenda &amp; facturation pour micro-entrepreneurs
            </span>
          </div>

          <nav>
            <Link href="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link href="/clients" className="nav-link">
              Clients
            </Link>
            <Link href="/services" className="nav-link">
              Services
            </Link>
            <Link href="/invoices" className="nav-link">
              Factures
            </Link>
            {/* 🔥 NOUVEAU : lien vers la page business */}
            <Link href="/business" className="nav-link">
              Mon business
            </Link>
          </nav>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Changer de thème"
          >
            <div className="theme-toggle-pill">
              <span className="theme-toggle-thumb" />
            </div>
            <span>{theme === 'light' ? 'Light' : 'Dark'} mode</span>
          </button>
        </header>

        <main>{children}</main>
      </div>
    </div>
  )
}
