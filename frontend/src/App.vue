<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="site-header">
    <strong>CIS 3339 · Student Management</strong>

    <nav aria-label="Main navigation">
      <RouterLink to="/students">Students</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>