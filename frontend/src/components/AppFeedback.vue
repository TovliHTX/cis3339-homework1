<script setup>
defineProps({
  success: { type: String, default: '' },
  error: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  loadingMessage: { type: String, default: 'Please wait…' },
})
</script>

<template>
  <div aria-live="polite" aria-atomic="true">
    <p v-if="loading" role="status">{{ loadingMessage }}</p>
    <p v-if="success" role="status">{{ success }}</p>
  </div>
  <div role="alert" aria-atomic="true">
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

