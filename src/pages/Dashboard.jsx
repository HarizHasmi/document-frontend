import useAuth from '../auth/useAuth'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getDocuments } from '../api/documents'
import Alert from '../components/Alert'
import RoleBadge from '../components/RoleBadge'
import Spinner from '../components/Spinner'
import { extractApiError } from '../utils/api'
import { canUploadDocuments } from '../utils/user'
import { formatDate } from '../utils/format'

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="ds-card p-5">
      <h3 className="text-sm font-semibold text-[#202224]">{title}</h3>
      <p className="mt-1 text-xs text-[#8a92a6]">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function BarListChart({ items, valueFormatter = value => value }) {
  const highest = Math.max(...items.map(item => item.value), 1)

  if (items.length === 0) {
    return <p className="text-sm text-[#8a92a6]">No data available yet.</p>
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const width = Math.max(6, (item.value / highest) * 100)
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <p className="truncate font-medium text-[#4a5571]">{item.label}</p>
              <p className="font-semibold text-[#202224]">{valueFormatter(item.value)}</p>
            </div>
            <div className="h-2 rounded-full bg-[#eef3ff]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#8ab0ff] to-[#4880ff]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalAccessible: 0,
    departmentDocs: 0,
    totalDownloads: 0,
  })
  const [analyticsDocs, setAnalyticsDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cards = useMemo(
    () => [
      { label: 'Total Accessible Documents', value: stats.totalAccessible },
      { label: 'Department Documents', value: stats.departmentDocs },
      { label: 'Total Downloads', value: stats.totalDownloads },
    ],
    [stats],
  )

  const categoryDownloadStats = useMemo(() => {
    const grouped = analyticsDocs.reduce((accumulator, doc) => {
      const key = doc?.category?.title || doc?.category?.name || 'Uncategorized'
      accumulator[key] = (accumulator[key] || 0) + (Number(doc?.download_count) || 0)
      return accumulator
    }, {})

    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [analyticsDocs])

  const topDocuments = useMemo(
    () =>
      [...analyticsDocs]
        .sort((a, b) => (Number(b?.download_count) || 0) - (Number(a?.download_count) || 0))
        .slice(0, 5)
        .map(doc => ({
          label: doc?.title || 'Untitled Document',
          value: Number(doc?.download_count) || 0,
        })),
    [analyticsDocs],
  )

  const recentActivity = useMemo(
    () =>
      [...analyticsDocs]
        .sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())
        .slice(0, 6)
        .map(doc => ({
          id: doc.id,
          action: `${doc?.uploader?.name || 'Someone'} uploaded "${doc?.title || 'Untitled'}"`,
          time: formatDate(doc?.created_at),
          access: doc?.access_level || 'public',
        })),
    [analyticsDocs],
  )

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      setError('')

      try {
        const allDocsPromise = getDocuments({ page: 1, per_page: 100 })
        const deptDocsPromise = user?.department_id
          ? getDocuments({ page: 1, department_id: user.department_id, per_page: 100 })
          : Promise.resolve({ data: [], total: 0 })

        const [allDocs, deptDocs] = await Promise.all([allDocsPromise, deptDocsPromise])
        const totalDownloads = allDocs.data.reduce((sum, doc) => sum + (Number(doc?.download_count) || 0), 0)

        setStats({
          totalAccessible: allDocs.total,
          departmentDocs: deptDocs.total,
          totalDownloads,
        })
        setAnalyticsDocs(allDocs.data)
      } catch (err) {
        setError(extractApiError(err, 'Unable to load dashboard statistics.'))
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user?.department_id])

  return (
    <div className="space-y-6">
      <div className="ds-card-soft p-6">
        <p className="text-sm text-[#5d75b2]">Welcome back,</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[#202224]">{user?.name || 'User'}</h1>
          <RoleBadge user={user} />
        </div>
        <p className="mt-3 text-sm text-[#6f7891]">
          Track your document access, review department activity, and quickly jump to your most-used actions.
        </p>
      </div>

      {loading ? (
        <div className="ds-card p-6">
          <Spinner size="md" label="Loading dashboard stats..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(card => (
            <div key={card.label} className="ds-card p-5">
              <p className="text-sm text-[#8a92a6]">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-[#202224]">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <Alert type="error" message={error} />

      <div className="ds-card p-6">
        <h2 className="text-lg font-semibold text-[#202224]">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/documents" className="ds-btn-primary inline-block">
            View Documents
          </Link>
          {canUploadDocuments(user) ? (
            <Link to="/documents/upload" className="ds-btn-secondary inline-block">
              Upload Document
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Download statistics by category"
          subtitle="Top categories ranked by total document downloads"
        >
          <BarListChart items={categoryDownloadStats} />
        </ChartCard>

        <ChartCard title="Top downloaded documents" subtitle="Most frequently downloaded files">
          <BarListChart items={topDocuments} />
        </ChartCard>
      </div>

      <div className="ds-card p-6">
        <h2 className="text-lg font-semibold text-[#202224]">Recent Activity</h2>
        <p className="mt-1 text-sm text-[#8a92a6]">Latest document uploads in your accessible workspace.</p>

        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-[#8a92a6]">No recent activity yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentActivity.map(activity => (
              <div
                key={activity.id}
                className="flex flex-col gap-2 rounded-xl border border-[#edf1f8] bg-[#fafcff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#4880ff]" />
                  <div>
                    <p className="text-sm font-medium text-[#202224]">{activity.action}</p>
                    <p className="mt-1 text-xs text-[#8a92a6]">Access level: {activity.access}</p>
                  </div>
                </div>
                <p className="text-xs text-[#8a92a6]">{activity.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
