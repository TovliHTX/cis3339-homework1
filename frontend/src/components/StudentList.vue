<script setup>
defineProps({
  students: { type: Array, required: true },
})
</script>

<template>
  <ul>
    <li v-for="student in students" :key="student._id">
      {{ student.name }} — {{ student.id }}
    </li>
  </ul>
</template>

