import React from 'react'
import {
  Palette,
  Check,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  User,
  Sliders,
  CheckCircle2,
} from 'lucide-react'
import { useAccent } from '@/context/AccentContext'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/auth/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AIBadge } from '@/components/ui/AIBadge'
import { useToast } from '@/components/ui/Toast'

export const Settings: React.FC = () => {
  const { preset, color, contrastColor, setAccentPreset, setCustomAccent, resetToDefault, presets } =
    useAccent()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { showToast } = useToast()

  const handleReset = () => {
    resetToDefault()
    showToast('Accent color reset to default Iris Indigo', 'info')
  }

  const handleCustomChange = (newHex: string) => {
    setCustomAccent(newHex)
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-fg tracking-tight">
            Settings & Appearance
          </h1>
          <Badge variant="brand" size="sm">
            Appearance
          </Badge>
        </div>
        <p className="text-sm text-charcoal mt-1">
          Customize your interface theme, primary brand accent color, and accessibility preferences.
        </p>
      </div>

      {/* 1. Accent Color Settings Card */}
      <Card className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold font-sans text-fg">Accent Color System</h2>
            </div>
            <p className="text-xs text-charcoal">
              Choose an accent color. Buttons, active links, badges, focus outlines, and the AI badge update instantly.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleReset}
            title="Reset accent color to default Iris Indigo"
          >
            Reset to Default
          </Button>
        </div>

        {/* Preset Swatches */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-fg uppercase tracking-wider">
            Preset Palettes (12 Curated Accents)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {presets.map((p) => {
              const isSelected = preset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAccentPreset(p.id)}
                  aria-label={p.label}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-[12px] border transition-all cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent select-none ${
                    isSelected
                      ? 'border-accent bg-accent-soft shadow-md ring-2 ring-accent/30 scale-[1.02]'
                      : 'border-line/80 bg-surface/80 backdrop-blur-md hover:bg-surface-2 hover:border-line-strong hover:scale-[1.01]'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-110 relative"
                    style={{ backgroundColor: p.color }}
                  >
                    {isSelected && (
                      <Check
                        className="w-5 h-5 transition-transform animate-fade-in"
                        style={{ color: contrastColor }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-fg mt-2 text-center truncate w-full">
                    {p.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Color Input */}
        <div className="p-4 sm:p-5 rounded-[12px] bg-surface-2/80 backdrop-blur-md border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-fg uppercase tracking-wider">
                Custom Color Picker
              </span>
              {preset === 'custom' && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-[6px] bg-accent text-accent-contrast font-bold shadow-sm">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-charcoal">
              Select any custom accent hue. High-contrast text is automatically calculated to meet WCAG AA.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-10 h-10 rounded-[10px] border border-line cursor-pointer p-0.5 bg-surface shadow-sm transition-transform hover:scale-105"
                title="Choose custom color"
                aria-label="Choose custom color"
              />
            </div>
          </div>
        </div>

        {/* Live Interactive Preview */}
        <div className="p-4 sm:p-5 rounded-[8px] bg-surface border border-line space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-fg uppercase tracking-wider">
                Live Interactive Component Preview
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>WCAG AA Contrast Compliant</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="primary" size="md">
              Primary Button
            </Button>
            <Button variant="outline" size="md" rightIcon={<ArrowRight className="w-3.5 h-3.5 text-accent" />}>
              Outline Action
            </Button>
            <Badge variant="brand" size="md">
              Brand Badge
            </Badge>
            <AIBadge label="AI Agent" size="md" />
            <a
              href="#preview"
              onClick={(e) => e.preventDefault()}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Interactive Link &rarr;
            </a>
          </div>

          {/* Sample Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-charcoal">
              <span>Syllabus Reading Progress</span>
              <span className="font-semibold text-fg">78%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-accent-soft overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: '78%', backgroundColor: color }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Theme Mode Card */}
      <Card className="p-4 sm:p-6 md:p-8 space-y-4">
        <div className="space-y-1 border-b border-line pb-4">
          <h2 className="text-lg font-bold font-sans text-fg">Display Theme Mode</h2>
          <p className="text-xs text-charcoal">
            Choose between light chalk canvas or sleek dark mode. Your accent color dynamically adapts to both.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Light Theme Button */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-[8px] border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-accent bg-accent-soft ring-2 ring-accent/30 shadow-sm'
                : 'border-line bg-surface hover:bg-surface-2'
            }`}
          >
            <div className="p-2.5 rounded-[8px] bg-white border border-line text-amber-500 shadow-sm">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-fg">Light Theme</span>
                {theme === 'light' && <Check className="w-4 h-4 text-accent" />}
              </div>
              <p className="text-xs text-charcoal mt-1">
                Quiet study desk aesthetic on Chalk Canvas (#f6f7fb) and Paper White cards.
              </p>
            </div>
          </button>

          {/* Dark Theme Button */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-[8px] border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-accent bg-accent-soft ring-2 ring-accent/30 shadow-sm'
                : 'border-line bg-surface hover:bg-surface-2'
            }`}
          >
            <div className="p-2.5 rounded-[8px] bg-[#1d2130] border border-line text-blue-400 shadow-sm">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-fg">Dark Theme</span>
                {theme === 'dark' && <Check className="w-4 h-4 text-accent" />}
              </div>
              <p className="text-xs text-charcoal mt-1">
                Deep navy background (#141722) for comfortable nighttime study sessions.
              </p>
            </div>
          </button>
        </div>
      </Card>

      {/* 3. Account & Role Summary */}
      {user && (
        <Card className="p-4 sm:p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <User className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold font-sans text-fg">Active Session Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-surface-2 rounded-[8px] border border-line">
              <span className="text-muted block text-[10px] uppercase font-semibold">User Name</span>
              <span className="font-bold text-fg text-sm">{user.name}</span>
            </div>
            <div className="p-3 bg-surface-2 rounded-[8px] border border-line">
              <span className="text-muted block text-[10px] uppercase font-semibold">Role</span>
              <span className="font-bold text-fg text-sm capitalize">{user.role}</span>
            </div>
            <div className="p-3 bg-surface-2 rounded-[8px] border border-line">
              <span className="text-muted block text-[10px] uppercase font-semibold">Department</span>
              <span className="font-bold text-fg text-sm">{user.profile.department || 'Computer Science'}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
export default Settings
