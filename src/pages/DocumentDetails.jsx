import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDocument, downloadDocument, getDocumentById } from '../api/documents'
import { getCategories, getDepartments } from '../api/master'
import useAuth from '../auth/useAuth'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import { extractApiError } from '../utils/api'
import { formatBytes, formatDate, titleCase } from '../utils/format'
import { canManageDocument } from '../utils/user'

function MetadataRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[#edf1f8] py-3 sm:grid-cols-3">
      <p className="text-sm font-medium text-[#6f7891]">{label}</p>
      <p className="text-sm text-slate-900 sm:col-span-2">{value ?? '-'}</p>
    </div>
  )
}

export default function DocumentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [documentData, setDocumentData] = useState(null)
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const categoryName = useMemo(() => {
    if (!documentData) return '-'
    if (documentData.category?.title) return documentData.category.title
    if (documentData.category?.name) return documentData.category.name
    const match = categories.find(item => Number(item.id) === Number(documentData.category_id))
    return match?.title || match?.name || '-'
  }, [documentData, categories])

  const departmentName = useMemo(() => {
    if (!documentData) return '-'
    if (documentData.department?.name) return documentData.department.name
    const match = departments.find(item => Number(item.id) === Number(documentData.department_id))
    return match?.name || '-'
  }, [documentData, departments])

  const uploaderName = useMemo(() => {
    if (!documentData) return '-'
    if (documentData.uploader?.name) return documentData.uploader.name
    if (documentData.uploader_name) return documentData.uploader_name
    if (Number(documentData.uploaded_by) === Number(user?.id)) return user?.name || '-'
    return documentData.uploaded_by ? `User #${documentData.uploaded_by}` : '-'
  }, [documentData, user?.id, user?.name])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      try {
        const [doc, categoryList, departmentList] = await Promise.all([
          getDocumentById(id),
          getCategories(),
          getDepartments(),
        ])
        setDocumentData(doc)
        setCategories(Array.isArray(categoryList) ? categoryList : [])
        setDepartments(Array.isArray(departmentList) ? departmentList : [])
      } catch (err) {
        setError(extractApiError(err, 'Unable to load document details.'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleDownload = async () => {
    if (!documentData) return

    setDownloading(true)
    setError('')
    try {
      await downloadDocument(documentData)
    } catch (err) {
      setError(extractApiError(err, 'Unable to download this document.'))
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!documentData) return

    setDeleting(true)
    setError('')
    try {
      await deleteDocument(documentData.id)
      navigate('/documents', { replace: true })
    } catch (err) {
      setError(extractApiError(err, 'Unable to delete this document.'))
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="ds-card p-6">
        <Spinner size="md" label="Loading document details..." />
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="ds-card p-6">
        <Alert type="error" message={error || 'Document not found.'} />
        <Link to="/documents" className="mt-4 inline-block text-sm font-medium text-[#4880ff] hover:underline">
          Back to Documents
        </Link>
      </div>
    )
  }

  const canManage = canManageDocument(user, documentData)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ds-page-title">{documentData.title || 'Document Details'}</h1>
          <p className="ds-page-subtitle">Review metadata and manage this document.</p>
        </div>
        <Link
          to="/documents"
          className="ds-btn-secondary"
        >
          Back to list
        </Link>
      </div>

      <Alert type="error" message={error} />

      <div className="ds-card p-6">
        <MetadataRow label="Title" value={documentData.title} />
        <MetadataRow label="Description" value={documentData.description || '-'} />
        <MetadataRow label="Category" value={categoryName} />
        <MetadataRow label="Department" value={departmentName} />
        <MetadataRow label="Access Level" value={titleCase(documentData.access_level)} />
        <MetadataRow label="File Name" value={documentData.file_name} />
        <MetadataRow label="File Type" value={documentData.file_type?.toUpperCase() || '-'} />
        <MetadataRow label="File Size" value={formatBytes(documentData.file_size)} />
        <MetadataRow label="Uploaded Date" value={formatDate(documentData.created_at)} />
        <MetadataRow label="Last Updated" value={formatDate(documentData.updated_at)} />
        <MetadataRow label="Uploader" value={uploaderName} />
        <MetadataRow label="Download Count" value={documentData.download_count ?? 0} />

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="ds-btn-primary disabled:cursor-not-allowed disabled:opacity-70"
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download'}
          </button>
          {canManage ? (
            <>
              <Link
                to={`/documents/${documentData.id}/edit`}
                className="ds-btn-secondary"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="ds-btn-danger"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete document"
        message="This action cannot be undone. Do you want to continue?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        loading={deleting}
        tone="danger"
      />
    </div>
  )
}
