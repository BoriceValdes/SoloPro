'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  // Charger le thème depuis localStorage + prefers-color-scheme
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('theme') as Theme | null
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
      document.documentElement.classList.toggle('theme-dark', stored === 'dark')
      return
    }

    const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches

    const initial: Theme = prefersDark ? 'dark' : 'light'
    setTheme(initial)
    document.documentElement.classList.toggle('theme-dark', initial === 'dark')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
