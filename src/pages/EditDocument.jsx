import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getDocumentById, updateDocument } from '../api/documents'
import { getCategories, getDepartments } from '../api/master'
import useAuth from '../auth/useAuth'
import Alert from '../components/Alert'
import Spinner from '../components/Spinner'
import { extractApiError } from '../utils/api'
import { canManageDocument, extractRole } from '../utils/user'

export default function EditDocument() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [documentData, setDocumentData] = useState(null)
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    department_id: '',
    access_level: 'department',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const role = extractRole(user)
  const canEdit = useMemo(() => canManageDocument(user, documentData), [user, documentData])
  const canEditDepartment = role === 'admin'

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
        setForm({
          title: doc.title || '',
          description: doc.description || '',
          category_id: String(doc.category_id || ''),
          department_id: String(doc.department_id || ''),
          access_level: doc.access_level || 'department',
        })
      } catch (err) {
        setError(extractApiError(err, 'Unable to load document for editing.'))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const validate = () => {
    const nextErrors = {}

    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.category_id) nextErrors.category_id = 'Category is required.'
    if (!form.department_id) nextErrors.department_id = 'Department is required.'
    if (!form.access_level) nextErrors.access_level = 'Access level is required.'

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSave = async event => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!validate()) return

    setSaving(true)
    try {
      const updated = await updateDocument(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: Number(form.category_id),
        department_id: Number(form.department_id),
        access_level: form.access_level,
      })
      setDocumentData(updated)
      setSuccess('Document details updated successfully.')
    } catch (err) {
      setError(extractApiError(err, 'Unable to save document changes.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="ds-card p-6">
        <Spinner size="md" label="Loading edit form..." />
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

  if (!canEdit) {
    return (
      <div className="ds-card p-6">
        <Alert type="error" message="You do not have permission to edit this document." />
        <Link
          to={`/documents/${documentData.id}`}
          className="mt-4 inline-block text-sm font-medium text-[#4880ff] hover:underline"
        >
          Back to Document Details
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ds-page-title">Edit Document</h1>
          <p className="ds-page-subtitle">Update document metadata.</p>
        </div>
        <Link
          to={`/documents/${documentData.id}`}
          className="ds-btn-secondary"
        >
          Cancel
        </Link>
      </div>

      <Alert type="success" message={success} />
      <Alert type="error" message={error} />

      <form onSubmit={onSave} className="ds-card p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Title
            </label>
            <input
              id="title"
              value={form.title}
              onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
              className="ds-input"
            />
            {fieldErrors.title ? <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
              className="ds-textarea"
            />
          </div>

          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Category
            </label>
            <select
              id="category"
              value={form.category_id}
              onChange={event => setForm(prev => ({ ...prev, category_id: event.target.value }))}
              className="ds-select"
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.title || category.name}
                </option>
              ))}
            </select>
            {fieldErrors.category_id ? <p className="mt-1 text-xs text-red-600">{fieldErrors.category_id}</p> : null}
          </div>

          <div>
            <label htmlFor="department" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Department
            </label>
            <select
              id="department"
              value={form.department_id}
              disabled={!canEditDepartment}
              onChange={event => setForm(prev => ({ ...prev, department_id: event.target.value }))}
              className={canEditDepartment ? 'ds-select' : 'ds-select cursor-not-allowed bg-[#f4f7ff] text-slate-600'}
            >
              <option value="">Select department</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            {fieldErrors.department_id ? <p className="mt-1 text-xs text-red-600">{fieldErrors.department_id}</p> : null}
            <p className="mt-1 text-xs text-slate-500">
              {canEditDepartment
                ? 'Admins can reassign document department.'
                : 'Only admins can change document department.'}
            </p>
          </div>

          <div>
            <label htmlFor="accessLevel" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Access Level
            </label>
            <select
              id="accessLevel"
              value={form.access_level}
              onChange={event => setForm(prev => ({ ...prev, access_level: event.target.value }))}
              className="ds-select"
            >
              <option value="public">Public</option>
              <option value="department">Department</option>
              <option value="private">Private</option>
            </select>
            {fieldErrors.access_level ? <p className="mt-1 text-xs text-red-600">{fieldErrors.access_level}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="ds-btn-primary disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/documents/${documentData.id}`)}
            className="ds-btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
