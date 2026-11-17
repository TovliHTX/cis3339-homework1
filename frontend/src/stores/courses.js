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

export const useCoursesStore = defineStore('courses', () => {
  const courses = ref([])

  async function loadCourses() {
    courses.value = await request('/courses')
  }

  async function addCourse(course) {
    const data = await request('/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    })

    courses.value = [...courses.value, data.course].sort((a, b) =>
      a.id.localeCompare(b.id),
    )
  }

  async function deleteCourse(recordId) {
    await request(`/courses/${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
    })

    courses.value = courses.value.filter((course) => course._id !== recordId)
  }

  return { courses, loadCourses, addCourse, deleteCourse }
})
