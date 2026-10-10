export const API_URL = 'http://localhost/kisumu-cbd-recovery/backend/api'

// Sends a POST request with JSON and returns { ok, status, data }
export async function apiPost(endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return { ok: response.ok, status: response.status, data }
}

// Sends a form with files (FormData). The browser sets the Content-Type itself.
export async function apiPostForm(endpoint, formData, token) {
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  const data = await response.json()
  return { ok: response.ok, status: response.status, data }
}