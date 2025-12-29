<!-- src/views/Placeholder.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>環境檢查</h2>
    </div>
    <div class="form-header"></div>
    <div class="form-content">
      <div class="form-section">
        <EnvForm />
      </div>
    </div>
  </div>
</template>

<script setup>
import EnvForm from "../components/EnvTest.vue";
</script>

<style scoped></style>
