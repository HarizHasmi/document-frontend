import api from './axios'
import { normalizePaginatedResponse, unwrapResource } from '../utils/api'

export const getDocuments = async (params = {}) => {
  const { data } = await api.get('/documents', { params })
  return normalizePaginatedResponse(data)
}

export const getDocumentById = async id => {
  const { data } = await api.get(`/documents/${id}`)
  return unwrapResource(data)
}

export const createDocument = async payload => {
  const { data } = await api.post('/documents', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return unwrapResource(data)
}

export const updateDocument = async (id, payload) => {
  const { data } = await api.patch(`/documents/${id}`, payload)
  return unwrapResource(data)
}

export const deleteDocument = async id => {
  await api.delete(`/documents/${id}`)
}

export const downloadDocument = async doc => {
  const { data } = await api.get(`/documents/${doc.id}/download`, {
    responseType: 'blob',
  })

  const fileName = doc?.file_name || `${doc?.title || 'document'}.${doc?.file_type || 'file'}`
  const blob = new Blob([data])
  const url = window.URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  window.document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
