<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="site-header">
    <strong>CIS 3339 · Student Management</strong>

    <nav aria-label="Main navigation">
      <RouterLink to="/students">Students</RouterLink>
      <RouterLink to="/courses">Courses</RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

nav a.router-link-active {
  font-weight: bold;
  text-decoration-thickness: 3px;
  text-underline-offset: 4px;
}
</style>