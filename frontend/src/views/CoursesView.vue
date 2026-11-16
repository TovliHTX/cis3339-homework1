<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useCoursesStore } from '@/stores/courses'

const store = useCoursesStore()

const form = reactive({
  id: '',
  name: '',
})

const loading = ref(true)
const busy = ref(false)
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

async function addCourse() {
  await perform(async () => {
    await store.addCourse({ ...form })
    Object.assign(form, { id: '', name: '' })
    success.value = 'Course added successfully.'
  })
}

async function deleteCourse(course) {
  if (!window.confirm(`Delete ${course.id} — ${course.name}?`)) return

  await perform(async () => {
    await store.deleteCourse(course._id)
    success.value = 'Course deleted successfully.'
  })
}

onMounted(async () => {
  try {
    await store.loadCourses()
  } catch (issue) {
    error.value = issue.message || 'Unable to load courses'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section aria-labelledby="courses-heading">
    <h1 id="courses-heading">Course management</h1>

    <p v-if="success" role="status">{{ success }}</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>

    <section class="panel" aria-labelledby="add-course-heading">
      <h2 id="add-course-heading">Add a course</h2>

      <form @submit.prevent="addCourse">
        <label for="course-id">Course ID</label>
        <input
          id="course-id"
          v-model.trim="form.id"
          placeholder="CIS 3339"
          required
        />

        <label for="course-name">Course name</label>
        <input
          id="course-name"
          v-model.trim="form.name"
          placeholder="Enterprise Applications Development"
          required
        />

        <button :disabled="busy || loading">
          {{ busy ? 'Please wait…' : 'Add course' }}
        </button>
      </form>
    </section>

    <section class="panel" aria-labelledby="course-list-heading">
      <h2 id="course-list-heading">All courses</h2>

      <p v-if="loading" role="status">Loading courses…</p>
      <p v-else-if="error && store.courses.length === 0">
        No courses to display. If loading failed, refresh to try again.
      </p>
      <p v-else-if="store.courses.length === 0">
        No courses have been added.
      </p>

      <ul v-else class="course-list">
        <li v-for="course in store.courses" :key="course._id">
          <div>
            <strong>{{ course.id }}</strong>
            <p>{{ course.name }}</p>
          </div>

          <button
            class="danger"
            :disabled="busy"
            :aria-label="`Delete course ${course.id}`"
            @click="deleteCourse(course)"
          >
            Delete
          </button>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.course-list {
  list-style: none;
  padding: 0;
}

.course-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #cbd5e1;
}

.course-list p {
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.course-list button {
  flex-shrink: 0;
}

@media (max-width: 450px) {
  .course-list li {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>