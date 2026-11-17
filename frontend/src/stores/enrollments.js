import { ref } from 'vue'
import { defineStore } from 'pinia'

const API_URL = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'The request failed')
  }

  return data
}

export const useEnrollmentsStore = defineStore('enrollments', () => {
  const roster = ref([])

  function clearRoster() {
    roster.value = []
  }

  async function enroll(studentId, courseId) {
    await request('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId }),
    })
  }

  async function loadRoster(courseId) {
    roster.value = await request(
      `/courses/${encodeURIComponent(courseId)}/students`,
    )
  }

  return { roster, clearRoster, enroll, loadRoster }
})
