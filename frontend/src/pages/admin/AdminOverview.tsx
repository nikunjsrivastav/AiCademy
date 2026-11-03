import React from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  BookOpen,
  Bot,
  Activity,
  PlayCircle,
  Cpu,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'

export const AdminOverview: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-[12px] border border-line bg-surface shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent px-2.5 py-1 rounded-[6px] bg-accent-soft border border-accent/20">
              Platform Administration (Read-Only)
            </span>
            <ExtensionTag label="MONITOR" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-sans text-fg tracking-tight">
            AiCademy System Console · {user?.name}
          </h2>
          <p className="text-sm text-charcoal leading-relaxed">
            Monitor platform health, inspect university course rosters, audit agent step traces and
            token consumption, and dispatch test triggers via the Orchestrator Event Simulator.
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3">
            <Link to="/a/simulator">
              <Button
                variant="primary"
                size="md"
                leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Launch Event Simulator
              </Button>
            </Link>
            <Link to="/a/runs">
              <Button variant="outline" size="md" leftIcon={<Bot className="w-3.5 h-3.5" />}>
                Inspect Agent Runs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row Floating on Chalk Canvas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Total Registered Users"
          value="11"
          subValue="8 students, 2 faculty, 1 admin"
          icon={<Users className="w-5 h-5 text-fg" />}
        />
        <StatCard
          label="Active Courses"
          value="3"
          subValue="Computer Science & AI"
          icon={<BookOpen className="w-5 h-5 text-fg" />}
        />
        <StatCard
          label="Agent Success Rate"
          value="98.4%"
          subValue="Across 142 total runs"
          trend={{ value: '0% hallucination', positive: true }}
          icon={<Activity className="w-5 h-5 text-[#1ca330]" />}
          badge={<AIBadge size="sm" label="Guardrails" />}
        />
        <StatCard
          label="Estimated Cost (Mo)"
          value="$14.20"
          subValue="Token Economics (GPT-4o)"
          icon={<Cpu className="w-5 h-5 text-accent" />}
          badge={<ExtensionTag label="ESTIMATE" />}
        />
      </div>

      {/* Admin Action Cards in Quizlet Study Set Card Style (8px radius, #ffffff surface) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-accent-soft border border-accent/25 flex items-center justify-center text-accent">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <CardTitle>Event Simulator</CardTitle>
              </div>
              <ExtensionTag />
            </CardHeader>
            <p className="text-xs text-charcoal mb-6 leading-relaxed">
              Dispatch autonomous lifecycle events like <code>material.uploaded</code> or <code>submission.created</code> to trigger orchestrated agent workflows.
            </p>
          </div>
          <Link to="/a/simulator">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Simulator
            </Button>
          </Link>
        </Card>

        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#e8f5e9] dark:bg-[#1b3320] border border-[#c8e6c9] dark:border-[#2a4d31] flex items-center justify-center text-[#1ca330]">
                  <Bot className="w-5 h-5" />
                </div>
                <CardTitle>Global Runs & Traces</CardTitle>
              </div>
              <AIBadge size="sm" />
            </CardHeader>
            <p className="text-xs text-charcoal mb-6 leading-relaxed">
              Audit full step-by-step traces, tool executions, token consumption, and override rates across all university courses.
            </p>
          </div>
          <Link to="/a/runs">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Global Runs
            </Button>
          </Link>
        </Card>

        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-surface-2 border border-line flex items-center justify-center text-fg">
                  <Users className="w-5 h-5" />
                </div>
                <CardTitle>Users & Courses Directory</CardTitle>
              </div>
            </CardHeader>
            <p className="text-xs text-charcoal mb-6 leading-relaxed">
              Inspect all enrolled students, teaching faculty, and active semester courses in read-only mode.
            </p>
          </div>
          <Link to="/a/users">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Directory
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
