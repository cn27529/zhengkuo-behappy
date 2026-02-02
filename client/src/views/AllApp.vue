<template>
  <div class="all-app-container">
    

    <div class="services-grid">
      <!-- 前端主應用 -->
      <div class="service-card frontend-card">
        <div class="card-header">
          <div class="icon">🖥️</div>
          <h3>前端主應用</h3>
        </div>
        <div class="card-content">
          <p>Vue.js 主要管理界面</p>
          <div class="features">
            <span class="feature-tag">消災超度</span>
            <span class="feature-tag">每月贊助</span>
            <span class="feature-tag">活動管理</span>
          </div>
        </div>
        <div class="card-actions">
          <a href="http://localhost:5173" target="_blank" class="btn btn-primary">
            訪問應用 →
          </a>
        </div>
      </div>

      <!-- Rust API 後端 -->
      <div class="service-card rust-card">
        <div class="card-header">
          <div class="icon">🦀</div>
          <h3>Rust API 後端</h3>
        </div>
        <div class="card-content">
          <p>高效能 Axum 後端服務</p>
          <div class="features">
            <span class="feature-tag">RESTful API</span>
            <span class="feature-tag">高效能</span>
            <span class="feature-tag">類型安全</span>
          </div>
        </div>
        <div class="card-actions">
          <a href="http://localhost:3000" target="_blank" class="btn btn-rust">
            API 文檔 →
          </a>
        </div>
      </div>

      <!-- Directus 後端 -->
      <div class="service-card directus-card">
        <div class="card-header">
          <div class="icon">📊</div>
          <h3>Directus 後端</h3>
        </div>
        <div class="card-content">
          <p>內容管理與數據管理界面</p>
          <div class="features">
            <span class="feature-tag">CMS</span>
            <span class="feature-tag">數據管理</span>
            <span class="feature-tag">管理界面</span>
          </div>
        </div>
        <div class="card-actions">
          <a href="http://localhost:8055" target="_blank" class="btn btn-directus">
            管理後台 →
          </a>
        </div>
      </div>

      <!-- 日誌服務器 -->
      <div class="service-card log-card">
        <div class="card-header">
          <div class="icon">📝</div>
          <h3>日誌服務器</h3>
        </div>
        <div class="card-content">
          <p>系統日誌收集與監控</p>
          <div class="features">
            <span class="feature-tag">MongoDB</span>
            <span class="feature-tag">日誌分析</span>
            <span class="feature-tag">監控</span>
          </div>
        </div>
        <div class="card-actions">
          <a href="http://localhost:3002" target="_blank" class="btn btn-log">
            查看日誌 →
          </a>
        </div>
      </div>

      <!-- 文檔服務器 -->
      <div class="service-card docs-card">
        <div class="card-header">
          <div class="icon">📚</div>
          <h3>文檔服務器</h3>
        </div>
        <div class="card-content">
          <p>專案文檔與開發指南</p>
          <div class="features">
            <span class="feature-tag">Markdown</span>
            <span class="feature-tag">API 文檔</span>
            <span class="feature-tag">開發指南</span>
          </div>
        </div>
        <div class="card-actions">
          <a href="http://localhost:3001" target="_blank" class="btn btn-docs">
            瀏覽文檔 →
          </a>
        </div>
      </div>

      <!-- 開發工具 -->
      <div class="service-card tools-card">
        <div class="card-header">
          <div class="icon">🛠️</div>
          <h3>開發工具</h3>
        </div>
        <div class="card-content">
          <p>開發調試與測試工具</p>
          <div class="features">
            <span class="feature-tag">DevTools</span>
            <span class="feature-tag">測試腳本</span>
            <span class="feature-tag">Mock 數據</span>
          </div>
        </div>
        <div class="card-actions">
          <router-link to="/dev-tools" class="btn btn-tools">
            開發工具 →
          </router-link>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="system-info">
        <h4>系統架構</h4>
        <div class="architecture-flow">
          <div class="arch-item">Vue.js 前端</div>
          <div class="arrow">→</div>
          <div class="arch-item">Rust/Node.js 後端</div>
          <div class="arrow">→</div>
          <div class="arch-item">SQLite/MongoDB</div>
        </div>
      </div>
      
      <div class="quick-links">
        <h4>快速連結</h4>
        <div class="links-grid">
          <a href="http://localhost:3001/doc/architecture-overview.md" target="_blank">架構總覽</a>
          <a href="http://localhost:3001/doc/deployment-guide.md" target="_blank">部署指南</a>
          <a href="http://localhost:3001/doc/api-documentation.md" target="_blank">API 文檔</a>
          <a href="http://localhost:3002/mongo.html" target="_blank">日誌監控</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  console.log('AllApp 頁面已載入')
})
</script>

<style scoped>
.all-app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.main-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto 3rem;
}

.service-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.15);
}

.frontend-card {
  border-left: 4px solid #4CAF50;
}

.frontend-card:hover {
  border-color: #4CAF50;
}

.rust-card {
  border-left: 4px solid #CE422B;
}

.rust-card:hover {
  border-color: #CE422B;
}

.directus-card {
  border-left: 4px solid #6644FF;
}

.directus-card:hover {
  border-color: #6644FF;
}

.log-card {
  border-left: 4px solid #FF9800;
}

.log-card:hover {
  border-color: #FF9800;
}

.docs-card {
  border-left: 4px solid #2196F3;
}

.docs-card:hover {
  border-color: #2196F3;
}

.tools-card {
  border-left: 4px solid #9C27B0;
}

.tools-card:hover {
  border-color: #9C27B0;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.icon {
  font-size: 2.5rem;
  margin-right: 1rem;
}

.card-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.card-content p {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.feature-tag {
  background: #f0f0f0;
  color: #666;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.card-actions {
  margin-top: auto;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  text-align: center;
  min-width: 120px;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
  transform: scale(1.05);
}

.btn-rust {
  background: #CE422B;
  color: white;
}

.btn-rust:hover {
  background: #b8391f;
  transform: scale(1.05);
}

.btn-directus {
  background: #6644FF;
  color: white;
}

.btn-directus:hover {
  background: #5a3de6;
  transform: scale(1.05);
}

.btn-log {
  background: #FF9800;
  color: white;
}

.btn-log:hover {
  background: #f57c00;
  transform: scale(1.05);
}

.btn-docs {
  background: #2196F3;
  color: white;
}

.btn-docs:hover {
  background: #1976D2;
  transform: scale(1.05);
}

.btn-tools {
  background: #9C27B0;
  color: white;
}

.btn-tools:hover {
  background: #7B1FA2;
  transform: scale(1.05);
}

.footer {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  color: white;
}

.system-info h4,
.quick-links h4 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #fff;
}

.architecture-flow {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.arch-item {
  background: rgba(255,255,255,0.2);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
}

.arrow {
  font-size: 1.2rem;
  font-weight: bold;
}

.links-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.links-grid a {
  color: rgba(255,255,255,0.9);
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.links-grid a:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

@media (max-width: 768px) {
  .all-app-container {
    padding: 1rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .services-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .footer {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .architecture-flow {
    justify-content: center;
  }
  
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>