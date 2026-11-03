import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/types/domain'
import { useAuth } from './AuthContext'

interface RoleGuardProps {
  allowedRoles: Role[]
  children?: React.ReactNode
}

export function getRoleHome(role?: Role | null): string {
  if (role === 'student') return '/s/dashboard'
  if (role === 'professor') return '/p/dashboard'
  if (role === 'administrator') return '/a/overview'
  return '/login'
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user?.role)} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
