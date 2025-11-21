<!-- src/views/Placeholder.vue -->
<template>
  <div class="main-content">
      <div class="page-header">
        <h2>環境檢查</h2>
      </div>
      <div class="form-header">
      </div>
      <div class="form-content">
        <div class="form-section">
          <EnvForm />
        </div>
      </div>
    </div>
</template>

<script>
import EnvForm from "../components/EnvTest.vue"

export default {
  name: 'Env',
  components: {
    EnvForm
  }
}
</script>

<style scoped>


.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.placeholder-content h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.placeholder-content p {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--secondary-color);
}
</style>