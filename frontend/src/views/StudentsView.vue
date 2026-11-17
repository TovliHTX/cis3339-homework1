<script setup>
import StudentList from '@/components/StudentList.vue'
import AppFeedback from '@/components/AppFeedback.vue'
import { onMounted, reactive, ref } from 'vue'
import { useStudentsStore } from '@/stores/students'

const store = useStudentsStore()

const form = reactive({
  name: '',
  id: '',
  phone: '',
  zip: '',
})

const searchName = ref('')
const result = ref(null)
const searched = ref(false)
const busy = ref(false)
const loading = ref(true)
const success = ref('')
const error = ref('')

async function perform(action) {
  busy.value = true
  success.value = ''
  error.value = ''

  try {
    await action()
  } catch (issue) {
    error.value = issue.message || 'Unable to complete the request'
  } finally {
    busy.value = false
  }
}

async function addStudent() {
  await perform(async () => {
    await store.addStudent({ ...form })
    Object.assign(form, { name: '', id: '', phone: '', zip: '' })
    success.value = 'Student added successfully.'
  })
}

async function searchStudent() {
  result.value = null
  searched.value = true

  await perform(async () => {
    result.value = await store.searchStudent(searchName.value.trim())
  })
}

async function deleteStudent() {
  if (!window.confirm(`Delete ${result.value.name}?`)) return

  await perform(async () => {
    await store.deleteStudent(result.value._id)
    result.value = null
    searched.value = false
    success.value = 'Student deleted successfully.'
  })
}

onMounted(async () => {
  try {
    await store.loadStudents()
  } catch (issue) {
    error.value = issue.message || 'Unable to load students'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section aria-labelledby="students-heading">
    <h1 id="students-heading">Student management</h1>

    <AppFeedback :success="success" :error="error" />

    <div class="panels">
      <section class="panel" aria-labelledby="add-heading">
        <h2 id="add-heading">Add a student</h2>

        <form @submit.prevent="addStudent">
          <label for="student-name">Name</label>
          <input id="student-name" v-model.trim="form.name" required />

          <label for="student-id">Student ID</label>
          <input id="student-id" v-model.trim="form.id" required />

          <label for="student-phone">Phone number</label>
          <input
            id="student-phone"
            v-model.trim="form.phone"
            type="tel"
            required
          />

          <label for="student-zip">ZIP code</label>
          <input
            id="student-zip"
            v-model.trim="form.zip"
            inputmode="numeric"
            required
          />

          <button :disabled="busy">
            {{ busy ? 'Please wait…' : 'Add student' }}
          </button>
        </form>
      </section>

      <section class="panel" aria-labelledby="search-heading">
        <h2 id="search-heading">Find a student</h2>
        <p>Enter the exact name, including capitalization.</p>

        <form @submit.prevent="searchStudent">
          <label for="search-name">Student name</label>
          <input id="search-name" v-model.trim="searchName" required />
          <button :disabled="busy">Search</button>
        </form>

        <div v-if="result" class="student-details">
          <h3>{{ result.name }}</h3>

          <dl>
            <dt>Student ID</dt>
            <dd>{{ result.id }}</dd>
            <dt>Phone</dt>
            <dd>{{ result.phone }}</dd>
            <dt>ZIP code</dt>
            <dd>{{ result.zip }}</dd>
          </dl>

          <button class="danger" :disabled="busy" @click="deleteStudent">
            Delete student
          </button>
        </div>

        <p v-else-if="!searched">Search results will appear here.</p>
      </section>
    </div>

    <section class="panel" aria-labelledby="list-heading">
      <h2 id="list-heading">All students</h2>

      <p v-if="loading" role="status">Loading students…</p>
      <p v-else-if="store.students.length === 0">No students have been added.</p>

      <StudentList v-else :students="store.students" />
    </section>
  </section>
</template>
