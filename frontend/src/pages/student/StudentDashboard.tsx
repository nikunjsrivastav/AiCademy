import React from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Sparkles,
  Award,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-[12px] border border-line bg-surface shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent px-2.5 py-1 rounded-[6px] bg-accent-soft border border-accent/20">
              Student Workspace
            </span>
            <AIBadge label="Agentic Copilot Active" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-sans text-fg tracking-tight">
            Welcome back, {user?.name}.
          </h2>
          <p className="text-sm text-charcoal leading-relaxed">
            Your course materials, doubt-solving tutor, and automated grading feedback are ready.
            All AI responses are grounded strictly in your syllabus with verified citations.
          </p>
          <div className="flex items-center gap-3 pt-3">
            <Link to="/s/courses">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Browse My Courses
              </Button>
            </Link>
            <Link to="/s/coach">
              <Button variant="outline" size="md" leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}>
                Check Study Plan <ExtensionTag className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row Floating on Chalk Canvas #f6f7fb */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Enrolled Courses"
          value="3"
          subValue="Active terms"
          icon={<BookOpen className="w-5 h-5 text-fg" />}
        />
        <StatCard
          label="Pending Submissions"
          value="2"
          subValue="Due this week"
          icon={<Clock className="w-5 h-5 text-fg" />}
          badge={<Badge variant="warning" size="sm">Action Needed</Badge>}
        />
        <StatCard
          label="Doubts Solved"
          value="14"
          subValue="100% Grounded"
          icon={<BrainCircuit className="w-5 h-5 text-accent" />}
          badge={<AIBadge size="sm" label="Tutor Agent" />}
        />
        <StatCard
          label="Class Rank"
          value="#4"
          subValue="Top 15%"
          trend={{ value: '+2 positions', positive: true }}
          icon={<Award className="w-5 h-5 text-fg" />}
        />
      </div>

      {/* Feature Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card variant="default" padding="standard" className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-line mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[8px] bg-accent-soft border border-accent/20 flex items-center justify-center text-accent shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg tracking-tight">Course Materials & Doubt Solver</h3>
                  <p className="text-xs text-muted">Vector-indexed materials with agentic citations</p>
                </div>
              </div>
              <AIBadge size="sm" />
            </div>
            <p className="text-xs text-charcoal leading-relaxed">
              Submit questions and receive answers strictly verified against course lecture slides,
              textbooks, and professor notes, with exact page citations and quality tips.
            </p>
          </div>
          <Link to="/s/courses">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Course Materials
            </Button>
          </Link>
        </Card>

        <Card variant="default" padding="standard" className="flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-line mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[8px] bg-accent-soft border border-accent/20 flex items-center justify-center text-accent shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-fg tracking-tight">Proactive Study Coach</h3>
                  <p className="text-xs text-muted">Personalized review schedule and weak topic nudges</p>
                </div>
              </div>
              <ExtensionTag />
            </div>
            <p className="text-xs text-charcoal leading-relaxed">
              The Study Coach Agent analyzes your assignment rubrics and quiz mistakes to build a
              3-step study plan ahead of assignment due dates.
            </p>
          </div>
          <Link to="/s/coach">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Study Coach
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
