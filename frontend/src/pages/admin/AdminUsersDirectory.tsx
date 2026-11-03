/**
 * Admin Users Directory page (Section 4 + Milestone 7).
 * Read-only directory of all student, faculty, and administrator accounts across the institution.
 */
import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Search } from 'lucide-react'
import type { User } from '@/types/domain'
import { getAdminUsers } from '@/services/admin'

export const AdminUsersDirectory: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const data = await getAdminUsers()
        setUsers(Array.isArray(data) ? data : [])
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-ink">Institutional Roster & Directory</h1>
        <p className="text-sm text-slate-500">
          Read-only institutional directory of students, faculty, and administrators.
        </p>
      </div>

      <Card padding="compact" className="border border-mist flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or university email..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs bg-chalk border border-mist rounded-[6px] px-3 py-2 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="professor">Professors</option>
          <option value="administrator">Administrators</option>
        </select>

        <span className="text-xs text-slate-400 font-mono ml-auto">
          {filtered.length} total accounts
        </span>
      </Card>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <Card padding="none" className="border border-mist overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-chalk text-slate-500 uppercase tracking-wider border-b border-mist">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Student ID / Bio</th>
                  <th className="py-3 px-4 font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-chalk/50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: `hsl(${u.profile.avatarHue || 200}, 70%, 45%)` }}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-ink">{u.name}</p>
                          <p className="text-slate-400 font-mono text-[11px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          u.role === 'administrator'
                            ? 'danger'
                            : u.role === 'professor'
                            ? 'brand'
                            : 'neutral'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{u.profile.department || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {u.profile.studentNumber || u.profile.bio || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
