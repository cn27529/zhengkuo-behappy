<!-- src/views/Placeholder.vue -->
<template>
  <div class="placeholder-container">
    <div class="placeholder-content">
      <h2>環境測試</h2>
    <EnvForm />
    </div>
  </div>
</template>

<script>
import EnvForm from '../components/EnvTest.vue'

export default {
  name: 'Env',
  components: {
    EnvForm
  }
}
</script>

<style scoped>
.placeholder-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.placeholder-content {
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 960px;
  width: 100%;
}

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