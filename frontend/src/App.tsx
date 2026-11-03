import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AccentProvider } from './context/AccentContext'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { RoleGuard, getRoleHome } from './auth/RoleGuard'
import { ToastProvider } from './components/ui/Toast'
import { AppShell } from './components/layout/AppShell'

// Auth Pages
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'

// Dashboards
import { StudentDashboard } from './pages/student/StudentDashboard'
import { StudentCourses } from './pages/student/StudentCourses'
import { StudentCourseDetail } from './pages/student/StudentCourseDetail'
import { ProfessorDashboard } from './pages/professor/ProfessorDashboard'
import { ProfessorCourses } from './pages/professor/ProfessorCourses'
import { ProfessorCourseDetail } from './pages/professor/ProfessorCourseDetail'
import { AdminOverview } from './pages/admin/AdminOverview'
import { Settings } from './pages/common/Settings'
import { AgentTraceViewer } from './pages/agents/AgentTraceViewer'
import { AgentRunsList } from './pages/agents/AgentRunsList'
import { AgentControlCenter } from './pages/agents/AgentControlCenter'
import { AgentMemoryViewer } from './pages/agents/AgentMemoryViewer'
import { ApprovalQueue } from './pages/professor/ApprovalQueue'
import { InsightsCopilot } from './pages/professor/InsightsCopilot'
import { StudyCoachPage } from './pages/student/StudyCoachPage'
import { StudentProgressPage } from './pages/student/StudentProgressPage'
import { EventSimulator } from './pages/admin/EventSimulator'
import { AdminUsersDirectory } from './pages/admin/AdminUsersDirectory'
import { AdminCoursesDirectory } from './pages/admin/AdminCoursesDirectory'

// Root redirect component
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={getRoleHome(user?.role)} replace />
}

const SettingsRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const prefix = user?.role === 'student' ? '/s' : user?.role === 'professor' ? '/p' : '/a'
  return <Navigate to={`${prefix}/settings`} replace />
}

import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AccentProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<RootRedirect />} />
              <Route path="/settings" element={<SettingsRedirect />} />

              {/* Protected Student Workspace */}
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleGuard allowedRoles={['student']} />}>
                  <Route element={<AppShell title="Student Workspace" subtitle="Autonomous Agentic Classroom" />}>
                    <Route path="/s" element={<Navigate to="/s/dashboard" replace />} />
                    <Route path="/s/dashboard" element={<StudentDashboard />} />
                    <Route path="/s/courses" element={<StudentCourses />} />
                    <Route path="/s/courses/:courseId" element={<StudentCourseDetail />} />
                    <Route path="/s/coach" element={<StudyCoachPage />} />
                    <Route path="/s/progress" element={<StudentProgressPage />} />
                    <Route path="/s/memory" element={<AgentMemoryViewer />} />
                    <Route path="/s/traces/:runId" element={<AgentTraceViewer />} />
                    <Route path="/s/settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Protected Professor Workspace */}
                <Route element={<RoleGuard allowedRoles={['professor']} />}>
                  <Route element={<AppShell title="Professor Studio" subtitle="Course Management & AI Grading" />}>
                    <Route path="/p" element={<Navigate to="/p/dashboard" replace />} />
                    <Route path="/p/dashboard" element={<ProfessorDashboard />} />
                    <Route path="/p/courses" element={<ProfessorCourses />} />
                    <Route path="/p/courses/:courseId" element={<ProfessorCourseDetail />} />
                    <Route path="/p/traces/:runId" element={<AgentTraceViewer />} />
                    <Route path="/p/approvals" element={<ApprovalQueue />} />
                    <Route path="/p/insights" element={<InsightsCopilot />} />
                    <Route path="/p/agents" element={<AgentControlCenter />} />
                    <Route path="/p/memory" element={<AgentMemoryViewer />} />
                    <Route path="/p/settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Protected Administrator Workspace */}
                <Route element={<RoleGuard allowedRoles={['administrator']} />}>
                  <Route element={<AppShell title="Administration Console" subtitle="System Health & Observability" />}>
                    <Route path="/a" element={<Navigate to="/a/overview" replace />} />
                    <Route path="/a/overview" element={<AdminOverview />} />
                    <Route path="/a/users" element={<AdminUsersDirectory />} />
                    <Route path="/a/courses" element={<AdminCoursesDirectory />} />
                    <Route path="/a/runs" element={<AgentRunsList />} />
                    <Route path="/a/traces/:runId" element={<AgentTraceViewer />} />
                    <Route path="/a/simulator" element={<EventSimulator />} />
                    <Route path="/a/settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Shared Agent Trace & Runs Root Routes */}
                <Route
                  path="/agents/traces/:runId"
                  element={
                    <AppShell title="Agent Trace" subtitle="Inspectable Step-by-Step Reasoning">
                      <AgentTraceViewer />
                    </AppShell>
                  }
                />
                <Route
                  path="/agents/runs"
                  element={
                    <AppShell title="Agent Control Center" subtitle="Autonomous Agent Runs">
                      <AgentRunsList />
                    </AppShell>
                  }
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
      </AccentProvider>
    </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
