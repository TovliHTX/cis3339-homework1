<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStudentsStore } from '@/stores/students'
import { useCoursesStore } from '@/stores/courses'
import { useEnrollmentsStore } from '@/stores/enrollments'

const studentsStore = useStudentsStore()
const coursesStore = useCoursesStore()
const enrollmentsStore = useEnrollmentsStore()

const studentId = ref('')
const courseId = ref('')
const rosterCourseId = ref('')
const loading = ref(true)
const busy = ref(false)
const rosterLoaded = ref(false)
const success = ref('')
const error = ref('')

const canEnroll = computed(
  () =>
    !loading.value &&
    !busy.value &&
    Boolean(studentId.value && courseId.value),
)

async function enroll() {
  busy.value = true
  success.value = ''
  error.value = ''

  try {
    await enrollmentsStore.enroll(studentId.value, courseId.value)
    success.value = 'Student enrolled successfully.'

    if (rosterLoaded.value && rosterCourseId.value === courseId.value) {
      await enrollmentsStore.loadRoster(rosterCourseId.value)
    }
  } catch (issue) {
    error.value = issue.message || 'Unable to enroll student'
  } finally {
    busy.value = false
  }
}

function clearRoster() {
  rosterLoaded.value = false
  enrollmentsStore.clearRoster()
}

async function loadRoster() {
  busy.value = true
  success.value = ''
  error.value = ''
  clearRoster()

  try {
    await enrollmentsStore.loadRoster(rosterCourseId.value)
    rosterLoaded.value = true
  } catch (issue) {
    error.value = issue.message || 'Unable to load roster'
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  enrollmentsStore.clearRoster()

  try {
    await Promise.all([
      studentsStore.loadStudents(),
      coursesStore.loadCourses(),
    ])
  } catch (issue) {
    error.value = issue.message || 'Unable to load enrollment options'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section aria-labelledby="enrollments-heading">
    <h1 id="enrollments-heading">Enrollment management</h1>

    <p v-if="loading" role="status">Loading students and courses…</p>
    <p v-if="busy" role="status">Please wait…</p>
    <p v-if="success" role="status">{{ success }}</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>

    <div class="panels">
      <section class="panel" aria-labelledby="enroll-heading">
        <h2 id="enroll-heading">Enroll a student</h2>

        <p
          v-if="
            !loading &&
            (!studentsStore.students.length || !coursesStore.courses.length)
          "
        >
          Add at least one student and one course before enrolling.
        </p>

        <form @submit.prevent="enroll">
          <label for="enrollment-student">Student</label>
          <select
            id="enrollment-student"
            v-model="studentId"
            :disabled="loading || busy"
            required
          >
            <option disabled value="">Select a student</option>
            <option
              v-for="student in studentsStore.students"
              :key="student._id"
              :value="student._id"
            >
              {{ student.name }} — {{ student.id }}
            </option>
          </select>

          <label for="enrollment-course">Course</label>
          <select
            id="enrollment-course"
            v-model="courseId"
            :disabled="loading || busy"
            required
          >
            <option disabled value="">Select a course</option>
            <option
              v-for="course in coursesStore.courses"
              :key="course._id"
              :value="course._id"
            >
              {{ course.id }} — {{ course.name }}
            </option>
          </select>

          <button :disabled="!canEnroll">Enroll student</button>
        </form>
      </section>

      <section class="panel" aria-labelledby="roster-heading">
        <h2 id="roster-heading">Course roster</h2>

        <form @submit.prevent="loadRoster">
          <label for="roster-course">Course to view</label>
          <select
            id="roster-course"
            v-model="rosterCourseId"
            :disabled="loading || busy"
            required
            @change="clearRoster"
          >
            <option disabled value="">Select a course</option>
            <option
              v-for="course in coursesStore.courses"
              :key="course._id"
              :value="course._id"
            >
              {{ course.id }} — {{ course.name }}
            </option>
          </select>

          <button :disabled="loading || busy || !rosterCourseId">
            View roster
          </button>
        </form>

        <div v-if="rosterLoaded" aria-live="polite">
          <p>Enrolled students: {{ enrollmentsStore.roster.length }}</p>

          <p v-if="!enrollmentsStore.roster.length">
            No students are enrolled in this course.
          </p>

          <ul v-else>
            <li
              v-for="student in enrollmentsStore.roster"
              :key="student._id"
            >
              {{ student.name }} — {{ student.id }}
            </li>
          </ul>
        </div>

        <p v-else>Select a course and choose View roster.</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
select {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0.65rem;
  font: inherit;
  color: #172536;
  background: white;
  border: 1px solid #65758a;
  border-radius: 0.25rem;
}
</style>