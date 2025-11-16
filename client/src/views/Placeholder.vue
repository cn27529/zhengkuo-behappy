<!-- src/views/Placeholder.vue -->
<template>
  <div class="placeholder-container">
    <div class="placeholder-content">
      <div class="placeholder-icon">🧱🚧🪨😓</div>
      <h2>功能开发中</h2>
      <p>此功能正在积极开发中，敬请期待！</p>
      <router-link to="/dashboard" class="btn btn-primary">
        返回仪表板
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Placeholder'
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
  max-width: 400px;
  width: 100%;
}

.placeholder-icon {
  font-size: 2rem;
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