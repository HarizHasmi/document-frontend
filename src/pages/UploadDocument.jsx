import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDocument } from '../api/documents'
import { getDepartments, getCategories } from '../api/master'
import useAuth from '../auth/useAuth'
import Alert from '../components/Alert'
import Spinner from '../components/Spinner'
import { extractApiError } from '../utils/api'
import { canUploadDocuments, extractRole } from '../utils/user'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'jpg', 'png']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function UploadDocument() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = extractRole(user) === 'manager'
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState('')
  const [category, setCategory] = useState('')
  const [accessLevel, setAccessLevel] = useState('department')
  const [departments, setDepartments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [departmentList, categoryList] = await Promise.all([getDepartments(), getCategories()])
        setDepartments(Array.isArray(departmentList) ? departmentList : [])
        setCategories(Array.isArray(categoryList) ? categoryList : [])
      } catch {
        setError('Unable to load departments or categories.')
      }
    }

    loadMasterData()
  }, [])

  useEffect(() => {
    if (isManager && user?.department_id) {
      setDepartment(String(user.department_id))
    }
  }, [isManager, user?.department_id])

  const validate = () => {
    const nextErrors = {}

    if (!title.trim()) nextErrors.title = 'Title is required.'
    if (!category) nextErrors.category = 'Category is required.'
    if (!department) nextErrors.department = 'Department is required.'
    if (!accessLevel) nextErrors.accessLevel = 'Access level is required.'
    if (!file) nextErrors.file = 'Please choose a file to upload.'
    if (isManager && department && Number(department) !== Number(user?.department_id)) {
      nextErrors.department = 'Managers can only upload documents to their own department.'
    }

    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        nextErrors.file = `Allowed file types: ${ALLOWED_EXTENSIONS.join(', ')}`
      }

      if (file.size > MAX_FILE_SIZE) {
        nextErrors.file = 'Maximum file size is 10MB.'
      }
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validate()) return

    setLoading(true)

    const form = new FormData()
    form.append('title', title.trim())
    form.append('description', description.trim())
    form.append('file', file)
    form.append('department_id', department)
    form.append('category_id', category)
    form.append('access_level', accessLevel)

    try {
      await createDocument(form)
      setSuccess('Document uploaded successfully.')
      setTitle('')
      setDescription('')
      setDepartment(isManager ? String(user?.department_id || '') : '')
      setCategory('')
      setAccessLevel('department')
      setFile(null)
      setFieldErrors({})
    } catch (err) {
      setError(extractApiError(err, 'Unable to upload document.'))
    } finally {
      setLoading(false)
    }
  }

  if (!canUploadDocuments(user)) {
    return (
      <div className="ds-card p-6">
        <h1 className="text-xl font-semibold text-[#202224]">Upload Document</h1>
        <Alert type="error" message="You do not have permission to upload documents." />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="ds-page-title">Upload Document</h1>
        <p className="ds-page-subtitle">Add a new document with metadata and access settings.</p>
      </div>

      <Alert type="success" message={success} />
      <Alert type="error" message={error} />

      <form onSubmit={submit} className="ds-card p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="ds-input"
              placeholder="Document title"
            />
            {fieldErrors.title ? <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              rows={4}
              className="ds-textarea"
              placeholder="Short description"
            />
          </div>

          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={event => setCategory(event.target.value)}
              className="ds-select"
            >
              <option value="">Select category</option>
              {categories.map(item => (
                <option key={item.id} value={item.id}>
                  {item.title || item.name}
                </option>
              ))}
            </select>
            {fieldErrors.category ? <p className="mt-1 text-xs text-red-600">{fieldErrors.category}</p> : null}
          </div>

          <div>
            <label htmlFor="department" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Department
            </label>
            <select
              id="department"
              value={department}
              onChange={event => setDepartment(event.target.value)}
              disabled={isManager}
              className={isManager ? 'ds-select cursor-not-allowed bg-[#f4f7ff] text-slate-600' : 'ds-select'}
            >
              <option value="">Select department</option>
              {departments.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {fieldErrors.department ? <p className="mt-1 text-xs text-red-600">{fieldErrors.department}</p> : null}
            {isManager ? (
              <p className="mt-1 text-xs text-slate-500">Managers can only upload to their own department.</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="accessLevel" className="mb-1 block text-sm font-medium text-[#4a5571]">
              Access Level
            </label>
            <select
              id="accessLevel"
              value={accessLevel}
              onChange={event => setAccessLevel(event.target.value)}
              className="ds-select"
            >
              <option value="public">Public</option>
              <option value="department">Department</option>
              <option value="private">Private</option>
            </select>
            {fieldErrors.accessLevel ? <p className="mt-1 text-xs text-red-600">{fieldErrors.accessLevel}</p> : null}
          </div>

          <div>
            <label htmlFor="file" className="mb-1 block text-sm font-medium text-[#4a5571]">
              File
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
              onChange={event => setFile(event.target.files?.[0] || null)}
              className="ds-input"
            />
            <p className="mt-1 text-xs text-slate-500">Allowed: PDF, DOCX, XLSX, JPG, PNG (max 10MB)</p>
            {fieldErrors.file ? <p className="mt-1 text-xs text-red-600">{fieldErrors.file}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="ds-btn-primary flex items-center disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? <Spinner size="sm" label="Uploading..." /> : 'Upload'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="ds-btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
