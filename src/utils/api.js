export function extractApiError(error, fallbackMessage = 'Something went wrong. Please try again.') {
  const responseData = error?.response?.data
  if (!responseData) return fallbackMessage

  if (typeof responseData.message === 'string') return responseData.message

  if (responseData.errors && typeof responseData.errors === 'object') {
    const firstField = Object.values(responseData.errors)[0]
    if (Array.isArray(firstField) && firstField.length > 0) return firstField[0]
  }

  return fallbackMessage
}

export function unwrapResource(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }

  return payload
}

export function normalizePaginatedResponse(payload) {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      current_page: 1,
      last_page: 1,
      total: payload.length,
    }
  }

  const resourceData = Array.isArray(payload?.data) ? payload.data : []
  const meta = payload?.meta ?? payload

  return {
    data: resourceData,
    current_page: Number(meta?.current_page ?? 1),
    last_page: Number(meta?.last_page ?? 1),
    total: Number(meta?.total ?? resourceData.length),
  }
}
