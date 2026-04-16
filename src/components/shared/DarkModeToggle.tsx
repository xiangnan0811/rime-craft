import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  // Apply class on state change. Do NOT write localStorage here — that
  // would shadow the "no preference, follow OS" case on mount.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  function handleToggle() {
    setDark((d) => {
      const next = !d
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light')
      } catch {
        // Silently ignore in restricted environments
      }
      return next
    })
  }

  // Cross-tab sync: mirror explicit choices from other tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'theme' && e.newValue) {
        setDark(e.newValue === 'dark')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Follow OS theme changes only when user hasn't chosen explicitly.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function onChange(e: MediaQueryListEvent) {
      try {
        if (localStorage.getItem('theme') !== null) return
      } catch {
        return
      }
      setDark(e.matches)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-9 w-9"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
