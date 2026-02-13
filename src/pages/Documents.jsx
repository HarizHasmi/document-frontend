import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDocument, downloadDocument, getDocuments } from '../api/documents'
import { getCategories, getDepartments } from '../api/master'
import useAuth from '../auth/useAuth'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import { extractApiError } from '../utils/api'
import { formatBytes, formatDate, titleCase } from '../utils/format'
import { canManageDocument, canUploadDocuments } from '../utils/user'

export default function Documents() {
  const { user } = useAuth()
  const [docs, setDocs] = useState({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
  })
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map(category => [String(category.id), category.title || category.name])),
    [categories],
  )
  const departmentMap = useMemo(
    () => Object.fromEntries(departments.map(department => [String(department.id), department.name])),
    [departments],
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [departmentList, categoryList] = await Promise.all([getDepartments(), getCategories()])
        setDepartments(Array.isArray(departmentList) ? departmentList : [])
        setCategories(Array.isArray(categoryList) ? categoryList : [])
      } catch {
        // Keep filters usable even if lookup data fails.
      }
    }

    loadMasterData()
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const payload = await getDocuments({
        page,
        per_page: 20,
        search: debouncedSearch || undefined,
        category_id: categoryId || undefined,
        department_id: departmentId || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setDocs(payload)
    } catch (err) {
      setError(extractApiError(err, 'Unable to load documents.'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, categoryId, departmentId, dateFrom, dateTo])

  useEffect(() => {
    load()
  }, [load])

  const tableDocuments = useMemo(() => {
    const list = Array.isArray(docs.data) ? [...docs.data] : []

    const fromBoundary = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const toBoundary = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null

    const filtered = list.filter(doc => {
      if (!fromBoundary && !toBoundary) return true

      const time = new Date(doc?.created_at || 0).getTime()
      if (!Number.isFinite(time)) return false
      if (fromBoundary && time < fromBoundary) return false
      if (toBoundary && time > toBoundary) return false
      return true
    })

    const direction = sortDirection === 'asc' ? 1 : -1

    const sorted = filtered.sort((left, right) => {
      const leftTitle = String(left?.title || '').toLowerCase()
      const rightTitle = String(right?.title || '').toLowerCase()

      if (sortBy === 'name') {
        return leftTitle.localeCompare(rightTitle) * direction
      }

      if (sortBy === 'downloads') {
        return ((Number(left?.download_count) || 0) - (Number(right?.download_count) || 0)) * direction
      }

      if (sortBy === 'size') {
        return ((Number(left?.file_size) || 0) - (Number(right?.file_size) || 0)) * direction
      }

      const leftDate = new Date(left?.created_at || 0).getTime()
      const rightDate = new Date(right?.created_at || 0).getTime()
      return (leftDate - rightDate) * direction
    })

    return sorted
  }, [docs.data, sortBy, sortDirection, dateFrom, dateTo])

  const uploaderName = doc => {
    if (doc?.uploader?.name) return doc.uploader.name
    if (doc?.uploader_name) return doc.uploader_name
    if (Number(doc?.uploaded_by) === Number(user?.id)) return user?.name || '-'
    if (doc?.uploaded_by) return `User #${doc.uploaded_by}`
    return '-'
  }

  const onDownload = async doc => {
    setDownloadingId(doc.id)
    setError('')
    try {
      await downloadDocument(doc)
    } catch (err) {
      setError(extractApiError(err, 'Unable to download document.'))
    } finally {
      setDownloadingId(null)
    }
  }

  const onConfirmDelete = async () => {
    if (!deletingDoc) return

    setIsDeleting(true)
    setError('')
    try {
      await deleteDocument(deletingDoc.id)
      setSuccess('Document deleted successfully.')
      setDeletingDoc(null)
      await load()
    } catch (err) {
      setError(extractApiError(err, 'Unable to delete the document.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setCategoryId('')
    setDepartmentId('')
    setPage(1)
    setSortBy('date')
    setSortDirection('desc')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ds-page-title">Documents</h1>
          <p className="ds-page-subtitle">Search, filter, and manage shared files.</p>
        </div>

        {canUploadDocuments(user) ? (
          <Link to="/documents/upload" className="ds-btn-primary">
            Upload Document
          </Link>
        ) : null}
      </div>

      <div className="ds-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by title or description"
            className="ds-input md:col-span-2"
          />
          <select
            value={categoryId}
            onChange={event => {
              setCategoryId(event.target.value)
              setPage(1)
            }}
            className="ds-select"
          >
            <option value="">All categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.title || category.name}
              </option>
            ))}
          </select>
          <select
            value={departmentId}
            onChange={event => {
              setDepartmentId(event.target.value)
              setPage(1)
            }}
            className="ds-select"
          >
            <option value="">All departments</option>
            {departments.map(department => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={sortBy}
            onChange={event => {
              setSortBy(event.target.value)
            }}
            className="ds-select"
          >
            <option value="name">Sort documents by name</option>
            <option value="date">Sort documents by date</option>
            <option value="downloads">Sort documents by downloads</option>
            <option value="size">Sort documents by size</option>
          </select>

          <select
            value={sortDirection}
            onChange={event => {
              setSortDirection(event.target.value)
              setPage(1)
            }}
            className="ds-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-xs font-medium text-[#8a92a6]">
              Upload date from
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={event => {
                setDateFrom(event.target.value)
                setPage(1)
              }}
              className="ds-input"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="mb-1 block text-xs font-medium text-[#8a92a6]">
              Upload date to
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={event => {
                setDateTo(event.target.value)
                setPage(1)
              }}
              className="ds-input"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <p>
            Showing {tableDocuments.length}
            {dateFrom || dateTo ? ` of ${docs.total}` : ''} documents
          </p>
          <button type="button" onClick={resetFilters} className="font-medium text-[#4880ff] hover:underline">
            Reset filters
          </button>
        </div>
      </div>

      <Alert type="success" message={success} />
      <Alert type="error" message={error} />

      <div className="ds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#edf1f8] text-left text-sm">
            <thead className="bg-[#f9fbff] text-xs uppercase text-[#6f7891]">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">File Type</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Upload Date</th>
                <th className="px-4 py-3">Uploader</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f4f9]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8">
                    <Spinner size="md" label="Loading documents..." />
                  </td>
                </tr>
              ) : tableDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8">
                    <EmptyState
                      title="No documents found"
                      description="Try changing the search text or filters to find what you need."
                    />
                  </td>
                </tr>
              ) : (
                tableDocuments.map(doc => (
                  <tr key={doc.id} className="hover:bg-[#f7f9ff]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{doc.title || '-'}</p>
                      <p className="text-xs text-slate-500">{titleCase(doc.access_level)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {doc.category?.title || doc.category?.name || categoryMap[String(doc.category_id)] || '-'}
                    </td>
                    <td className="px-4 py-3">{doc.department?.name || departmentMap[String(doc.department_id)] || '-'}</td>
                    <td className="px-4 py-3 uppercase">{doc.file_type || '-'}</td>
                    <td className="px-4 py-3">{formatBytes(doc.file_size)}</td>
                    <td className="px-4 py-3">{formatDate(doc.created_at)}</td>
                    <td className="px-4 py-3">{uploaderName(doc)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="rounded-md border border-[#d9e2f1] px-2.5 py-1.5 text-xs font-medium text-[#3b4a6b] hover:bg-[#f2f6ff]"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDownload(doc)}
                          className="rounded-md border border-[#d9e2f1] px-2.5 py-1.5 text-xs font-medium text-[#3b4a6b] hover:bg-[#f2f6ff]"
                          disabled={downloadingId === doc.id}
                        >
                          {downloadingId === doc.id ? '...' : 'Download'}
                        </button>
                        {canManageDocument(user, doc) ? (
                          <>
                            <Link
                              to={`/documents/${doc.id}/edit`}
                              className="rounded-md border border-[#cfe0ff] px-2.5 py-1.5 text-xs font-medium text-[#3f5cae] hover:bg-[#eef4ff]"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeletingDoc(doc)}
                              className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && docs.last_page > 1 ? (
          <div className="flex items-center justify-between border-t border-[#edf1f8] px-4 py-3 text-sm">
            <p className="text-[#6f7891]">
              Page {docs.current_page} of {docs.last_page}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={docs.current_page <= 1}
                className="rounded-lg border border-[#d9e2f1] px-3 py-1.5 text-[#3f4d6b] hover:bg-[#f2f6ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(prev => Math.min(prev + 1, docs.last_page))}
                disabled={docs.current_page >= docs.last_page}
                className="rounded-lg border border-[#d9e2f1] px-3 py-1.5 text-[#3f4d6b] hover:bg-[#f2f6ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deletingDoc)}
        title="Delete document"
        message={`Are you sure you want to delete "${deletingDoc?.title || 'this document'}"? This action cannot be undone.`}
        confirmText="Delete"
        tone="danger"
        onCancel={() => setDeletingDoc(null)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
      />
    </div>
  )
}
