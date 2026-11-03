/**
 * EXTENSION: Global Command Palette from /docs/AGENTIC_DESIGN.md and Milestone 8.
 * Activated by Ctrl+K / Cmd+K or search bar click for rapid keyboard navigation.
 */
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import {
  Search,
  BookOpen,
  Bot,
  ShieldCheck,
  Compass,
  Award,
  Settings,
  Zap,
  Sparkles,
  Users,
} from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  subtitle: string
  category: 'Navigation' | 'Agents' | 'Courses' | 'Settings'
  icon: React.ReactNode
  path: string
  roles?: string[]
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { user } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const prefix = user?.role === 'student' ? '/s' : user?.role === 'professor' ? '/p' : '/a'

  const items: CommandItem[] = [
    {
      id: 'courses',
      title: 'Course Catalog & Studio',
      subtitle: 'Browse enrolled courses and learning materials',
      category: 'Courses',
      icon: <BookOpen className="w-4 h-4 text-accent" />,
      path: `${prefix}/courses`,
    },
    {
      id: 'coach',
      title: 'Proactive Study Coach',
      subtitle: 'Personalized 3-step mastery sprint and deadline nudges',
      category: 'Agents',
      icon: <Compass className="w-4 h-4 text-emerald-500" />,
      path: '/s/coach',
      roles: ['student'],
    },
    {
      id: 'progress',
      title: 'Academic Progress & Leaderboard',
      subtitle: 'Assignment scores, question quality, and rankings',
      category: 'Navigation',
      icon: <Award className="w-4 h-4 text-amber-500" />,
      path: '/s/progress',
      roles: ['student'],
    },
    {
      id: 'approvals',
      title: 'Human Approval Queue',
      subtitle: 'Review AI-evaluated student submissions and draft announcements',
      category: 'Agents',
      icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
      path: '/p/approvals',
      roles: ['professor', 'administrator'],
    },
    {
      id: 'insights',
      title: 'Teaching Insights Copilot',
      subtitle: 'Curriculum friction topics and 1-click revision announcements',
      category: 'Agents',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
      path: '/p/insights',
      roles: ['professor', 'administrator'],
    },
    {
      id: 'agent_control',
      title: 'Agent Control Center',
      subtitle: 'Configure per-course agent activation and daily token budgets',
      category: 'Agents',
      icon: <Bot className="w-4 h-4 text-accent" />,
      path: `${prefix}/agents`,
      roles: ['professor', 'administrator'],
    },
    {
      id: 'runs',
      title: 'Agent Runs & Traces Dashboard',
      subtitle: 'Inspect step-by-step reasoning, tool logs, and token costs',
      category: 'Agents',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      path: '/agents/runs',
      roles: ['professor', 'administrator'],
    },
    {
      id: 'simulator',
      title: 'Orchestrator Event Simulator',
      subtitle: 'Dispatch real-time B6 domain events to the Orchestrator',
      category: 'Agents',
      icon: <Zap className="w-4 h-4 text-rose-500" />,
      path: '/a/simulator',
      roles: ['administrator'],
    },
    {
      id: 'users',
      title: 'Institutional Users Directory',
      subtitle: 'Roster of students, faculty, and administrator accounts',
      category: 'Navigation',
      icon: <Users className="w-4 h-4 text-slate-500" />,
      path: '/a/users',
      roles: ['administrator'],
    },
    {
      id: 'memory',
      title: 'Agent Memory Transparency',
      subtitle: 'Inspect and delete adaptive memory profiles (D16)',
      category: 'Settings',
      icon: <Bot className="w-4 h-4 text-accent" />,
      path: `${prefix}/memory`,
    },
    {
      id: 'settings',
      title: 'System Settings & Accent Swatches',
      subtitle: 'Custom color engine, theme toggle, and WCAG contrast',
      category: 'Settings',
      icon: <Settings className="w-4 h-4 text-slate-500" />,
      path: `${prefix}/settings`,
    },
  ]

  const userRole = user?.role || 'student'
  const filtered = items.filter((item) => {
    if (item.roles && !item.roles.includes(userRole)) return false
    const q = query.toLowerCase().trim()
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    )
  })

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
    }
  }, [isOpen])

  const handleSelect = (path: string) => {
    setIsOpen(false)
    setQuery('')
    navigate(path)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[12px] shadow-2xl border border-mist overflow-hidden z-10 animate-in fade-in-0 zoom-in-95">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-mist">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
              } else if (e.key === 'Enter' && filtered[selectedIndex]) {
                e.preventDefault()
                handleSelect(filtered[selectedIndex].path)
              }
            }}
            placeholder="Type a command or jump to page... (Esc to close)"
            className="w-full py-3.5 text-xs text-ink placeholder:text-slate-400 focus:outline-none bg-transparent font-medium"
          />
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No matching commands or navigation routes found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.path)}
                  className={`w-full px-3 py-2.5 rounded-[8px] flex items-center justify-between text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-accent-soft text-accent' : 'hover:bg-chalk text-ink'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-mist shrink-0">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-xs font-bold">{item.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-[4px] bg-white dark:bg-slate-800 border border-mist text-slate-400">
                    {item.category}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-chalk border-t border-mist flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Navigate with ↑ ↓ • Press Enter to select</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  )
}
