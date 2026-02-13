import api from './axios'
import { unwrapResource } from '../utils/api'

export const login = async (email, password) => {
  const { data } = await api.post('/login', { email, password })
  return unwrapResource(data)
}

export const logout = async () => {
  await api.post('/logout')
}

export const fetchUser = async () => {
  const { data } = await api.get('/user')
  return unwrapResource(data)
}
