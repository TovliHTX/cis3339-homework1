import { ref } from 'vue'
import { defineStore } from 'pinia'

const API_URL = 'http://localhost:3000'

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

export const useStudentsStore = defineStore('students', () => {
  const students = ref([])

  async function loadStudents() {
    students.value = await request('/students')
  }

  async function addStudent(student) {
    const data = await request('/add-student', {
      method: 'POST',
      body: JSON.stringify(student),
    })

    await loadStudents()
    return data.student
  }

  async function searchStudent(name) {
    return request('/find-student', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async function deleteStudent(recordId) {
    await request(`/students/${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
    });

    await loadStudents();
  }

  return {
    students,
    loadStudents,
    addStudent,
    searchStudent,
    deleteStudent,
  }
})