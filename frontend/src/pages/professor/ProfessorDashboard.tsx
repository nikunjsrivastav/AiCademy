import React from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Sparkles,
  ShieldAlert,
  Cpu,
  ArrowRight,
  Users,
  Database,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { AutonomyBadge } from '@/components/ui/AutonomyBadge'

export const ProfessorDashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-[12px] border border-line bg-surface shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent px-2.5 py-1 rounded-[6px] bg-accent-soft border border-accent/20">
              Professor Studio
            </span>
            <AIBadge label="Human-in-the-Loop Safe" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-sans text-fg tracking-tight">
            Welcome back, {user?.name}.
          </h2>
          <p className="text-sm text-charcoal leading-relaxed">
            The Grader, Ingestion, and Insights agents assist your courses while keeping you in
            total control. No grades or announcements are published without your explicit review.
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3">
            <Link to="/p/approvals">
              <Button
                variant="primary"
                size="md"
                leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-accent-contrast" />}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Review Approval Queue (3)
              </Button>
            </Link>
            <Link to="/p/courses">
              <Button variant="outline" size="md">
                Course Studio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row Floating on Chalk Canvas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Active Courses"
          value="2"
          subValue="CS301 & CS220"
          icon={<BookOpen className="w-5 h-5 text-fg" />}
        />
        <StatCard
          label="Pending Approvals"
          value="3"
          subValue="Requires professor decision"
          icon={<ShieldAlert className="w-5 h-5 text-[#b37e09]" />}
          badge={<AutonomyBadge level="needs_approval" size="sm" />}
        />
        <StatCard
          label="Enrolled Students"
          value="48"
          subValue="Across 2 courses"
          icon={<Users className="w-5 h-5 text-fg" />}
        />
        <StatCard
          label="Indexed Materials"
          value="18"
          subValue="ChromaDB RAG Chunks"
          icon={<Database className="w-5 h-5 text-accent" />}
          badge={<AIBadge size="sm" label="Ingested" />}
        />
      </div>

      {/* Feature Action Cards in Quizlet Study Set Card Style (8px radius, #ffffff surface) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#fff8e1] dark:bg-[#38311a] border border-[#ffe082] dark:border-[#544822] flex items-center justify-center text-[#b37e09]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <CardTitle>Approval Queue</CardTitle>
              </div>
              <ExtensionTag />
            </CardHeader>
            <p className="text-xs text-charcoal mb-6 leading-relaxed">
              Review AI criterion scores, override marks, and approve agent-drafted course announcements.
            </p>
          </div>
          <Link to="/p/approvals">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Inbox
            </Button>
          </Link>
        </Card>

        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-accent-soft border border-accent/25 flex items-center justify-center text-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
                <CardTitle>Teaching Insights</CardTitle>
              </div>
              <AIBadge size="sm" />
            </CardHeader>
            <p className="text-xs text-charcoal mb-6 leading-relaxed">
              AI copilot highlights weak student topics, question distribution, and drafts revision announcements.
            </p>
          </div>
          <Link to="/p/insights">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Insights
            </Button>
          </Link>
        </Card>

        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#e8f5e9] dark:bg-[#1b3320] border border-[#c8e6c9] dark:border-[#2a4d31] flex items-center justify-center text-[#1ca330]">
                  <Cpu className="w-5 h-5" />
                </div>
                <CardTitle>Agent Control</CardTitle>
              </div>
              <ExtensionTag />
            </CardHeader>
            <p className="text-xs text-charcoal mb-6 leading-relaxed">
              Configure agent autonomy, token budgets, and grading confidence thresholds per course.
            </p>
          </div>
          <Link to="/p/agents">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Course Policies
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
