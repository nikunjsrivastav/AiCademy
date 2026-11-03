import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bot, Construction } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { useAuth } from '@/auth/AuthContext'
import { getRoleHome } from '@/auth/RoleGuard'

interface MilestonePlaceholderProps {
  title: string
  milestone: string
  description: string
  agentName?: string
  isExtension?: boolean
}

export const MilestonePlaceholder: React.FC<MilestonePlaceholderProps> = ({
  title,
  milestone,
  description,
  agentName,
  isExtension = false,
}) => {
  const { user } = useAuth()
  const home = getRoleHome(user?.role)

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12">
      <Card className="p-6 sm:p-10 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-[8px] bg-surface-2 border border-line flex items-center justify-center text-charcoal shadow-sm">
          {agentName ? <Bot className="w-7 h-7 text-accent" /> : <Construction className="w-7 h-7 text-charcoal" />}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-[4px] bg-accent-soft text-accent border border-accent/20">
              {milestone}
            </span>
            {isExtension && <ExtensionTag />}
            {agentName && <AIBadge label={agentName} />}
          </div>
          <h2 className="text-xl font-bold text-fg tracking-tight font-sans">{title}</h2>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">{description}</p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link to={home}>
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
