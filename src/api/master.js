import api from './axios'
import { unwrapResource } from '../utils/api'

export const getDepartments = async () => {
  const { data } = await api.get('/departments')
  return unwrapResource(data)
}

export const getCategories = async () => {
  const { data } = await api.get('/categories')
  return unwrapResource(data)
}
