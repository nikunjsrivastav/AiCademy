import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type AccentPresetId =
  | 'indigo'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'pink'
  | 'fuchsia'
  | 'violet'
  | 'purple'
  | 'custom'

export interface AccentPreset {
  id: AccentPresetId
  name: string
  label: string
  color: string
  hover: string
  softLight: string
  softDark: string
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'indigo',
    name: 'Iris Indigo',
    label: 'Iris Indigo (Default)',
    color: '#4255ff',
    hover: '#3244e8',
    softLight: '#edefff',
    softDark: 'rgba(66, 85, 255, 0.22)',
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    label: 'Ocean Blue accent',
    color: '#2563eb',
    hover: '#1d4ed8',
    softLight: '#eff6ff',
    softDark: 'rgba(37, 99, 235, 0.22)',
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    label: 'Electric Cyan accent',
    color: '#0891b2',
    hover: '#0e7490',
    softLight: '#ecfeff',
    softDark: 'rgba(8, 145, 178, 0.22)',
  },
  {
    id: 'teal',
    name: 'Deep Teal',
    label: 'Deep Teal accent',
    color: '#0d9488',
    hover: '#0f766e',
    softLight: '#f0fdfa',
    softDark: 'rgba(13, 148, 136, 0.22)',
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    label: 'Forest Emerald accent',
    color: '#059669',
    hover: '#047857',
    softLight: '#ecfdf5',
    softDark: 'rgba(5, 150, 105, 0.22)',
  },
  {
    id: 'amber',
    name: 'Sunburst Amber',
    label: 'Sunburst Amber accent',
    color: '#d97706',
    hover: '#b45309',
    softLight: '#fffbeb',
    softDark: 'rgba(217, 119, 6, 0.22)',
  },
  {
    id: 'orange',
    name: 'Sunset Coral',
    label: 'Sunset Coral accent',
    color: '#ea580c',
    hover: '#c2410c',
    softLight: '#fff7ed',
    softDark: 'rgba(234, 88, 12, 0.22)',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    label: 'Crimson Rose accent',
    color: '#e11d48',
    hover: '#be123c',
    softLight: '#fff1f2',
    softDark: 'rgba(225, 29, 72, 0.22)',
  },
  {
    id: 'pink',
    name: 'Vivid Pink',
    label: 'Vivid Pink accent',
    color: '#db2777',
    hover: '#be185d',
    softLight: '#fdf2f8',
    softDark: 'rgba(219, 39, 119, 0.22)',
  },
  {
    id: 'fuchsia',
    name: 'Neon Fuchsia',
    label: 'Neon Fuchsia accent',
    color: '#c026d3',
    hover: '#a21caf',
    softLight: '#fae8ff',
    softDark: 'rgba(192, 38, 211, 0.22)',
  },
  {
    id: 'violet',
    name: 'Amethyst Violet',
    label: 'Amethyst Violet accent',
    color: '#7c3aed',
    hover: '#6d28d9',
    softLight: '#f5f3ff',
    softDark: 'rgba(124, 58, 237, 0.22)',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    label: 'Royal Purple accent',
    color: '#9333ea',
    hover: '#7e22ce',
    softLight: '#faf5ff',
    softDark: 'rgba(147, 51, 234, 0.22)',
  },
]

export const DEFAULT_ACCENT_PRESET: AccentPresetId = 'indigo'
export const ACCENT_STORAGE_KEY = 'aicademy.accent'

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ]
  }
  return [
    parseInt(clean.substring(0, 2), 16) || 0,
    parseInt(clean.substring(2, 4), 16) || 0,
    parseInt(clean.substring(4, 6), 16) || 0,
  ]
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Automatically compute WCAG AA high-contrast text color (white or dark charcoal).
 */
export function getContrastTextColor(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const lum = getRelativeLuminance(r, g, b)
  // Contrast ratio with white (L=1.0) is (1.0 + 0.05) / (lum + 0.05)
  const whiteContrast = 1.05 / (lum + 0.05)
  return whiteContrast >= 3.5 ? '#ffffff' : '#141722'
}

export function adjustHexBrightness(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex)
  const factor = 1 + percent / 100
  const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val)))
  const nr = clamp(r * factor).toString(16).padStart(2, '0')
  const ng = clamp(g * factor).toString(16).padStart(2, '0')
  const nb = clamp(b * factor).toString(16).padStart(2, '0')
  return `#${nr}${ng}${nb}`
}

export interface StoredAccentState {
  preset: AccentPresetId
  color: string
}

export interface AccentContextValue {
  preset: AccentPresetId
  color: string
  contrastColor: string
  setAccentPreset: (presetId: AccentPresetId) => void
  setCustomAccent: (hex: string) => void
  resetToDefault: () => void
  presets: AccentPreset[]
}

const AccentContext = createContext<AccentContextValue | undefined>(undefined)

export function applyAccentToCss(color: string, hover: string, softLight: string, softDark: string) {
  const root = document.documentElement
  const [r, g, b] = hexToRgb(color)
  const contrast = getContrastTextColor(color)
  const isDark = root.classList.contains('dark')

  root.style.setProperty('--accent', color)
  root.style.setProperty('--accent-hover', hover)
  root.style.setProperty('--accent-soft', isDark ? softDark : softLight)
  root.style.setProperty('--accent-contrast', contrast)
  root.style.setProperty('--accent-ring', `rgba(${r}, ${g}, ${b}, 0.35)`)
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`)

  // Backwards compatibility with --iris-bolt and --blue tokens
  root.style.setProperty('--iris-bolt', color)
  root.style.setProperty('--blue', color)
  root.style.setProperty('--blue-deep', hover)
}

export const AccentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentState, setAccentState] = useState<StoredAccentState>(() => {
    try {
      const raw = localStorage.getItem(ACCENT_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredAccentState
        if (parsed.preset && parsed.color) return parsed
      }
    } catch {
      // ignore
    }
    const def = ACCENT_PRESETS[0]
    return { preset: def.id, color: def.color }
  })

  const applyCurrentAccent = useCallback((state: StoredAccentState) => {
    let hover = ''
    let softLight = ''
    let softDark = ''

    const presetObj = ACCENT_PRESETS.find((p) => p.id === state.preset)
    if (presetObj && state.preset !== 'custom') {
      hover = presetObj.hover
      softLight = presetObj.softLight
      softDark = presetObj.softDark
    } else {
      // Custom color calculation
      hover = adjustHexBrightness(state.color, -12)
      const [r, g, b] = hexToRgb(state.color)
      softLight = `rgba(${r}, ${g}, ${b}, 0.12)`
      softDark = `rgba(${r}, ${g}, ${b}, 0.24)`
    }

    applyAccentToCss(state.color, hover, softLight, softDark)

    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage blocked/unavailable
    }
  }, [])

  useEffect(() => {
    applyCurrentAccent(accentState)
  }, [accentState, applyCurrentAccent])

  // Re-sync soft accent when document theme class changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyCurrentAccent(accentState)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [accentState, applyCurrentAccent])

  const setAccentPreset = (presetId: AccentPresetId) => {
    const found = ACCENT_PRESETS.find((p) => p.id === presetId)
    if (found) {
      setAccentState({ preset: found.id, color: found.color })
    }
  }

  const setCustomAccent = (hex: string) => {
    if (!hex.startsWith('#')) hex = `#${hex}`
    setAccentState({ preset: 'custom', color: hex })
  }

  const resetToDefault = () => {
    const def = ACCENT_PRESETS[0]
    setAccentState({ preset: def.id, color: def.color })
  }

  const contrastColor = getContrastTextColor(accentState.color)

  return (
    <AccentContext.Provider
      value={{
        preset: accentState.preset,
        color: accentState.color,
        contrastColor,
        setAccentPreset,
        setCustomAccent,
        resetToDefault,
        presets: ACCENT_PRESETS,
      }}
    >
      {children}
    </AccentContext.Provider>
  )
}

export function useAccent(): AccentContextValue {
  const ctx = useContext(AccentContext)
  if (!ctx) throw new Error('useAccent must be used within AccentProvider')
  return ctx
}
