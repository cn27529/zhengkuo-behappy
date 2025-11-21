<template>
  <div class="el-dialog-demo">
    <div class="header">
      <h1>Element Plus El-Dialog 样式自定义</h1>
      <p>基于 el-dialog 标签的样式修改方案</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <h3>基础样式</h3>
        <el-button type="primary" @click="openDialog('default')">默认样式</el-button>
        <el-button @click="openDialog('custom')">自定义样式</el-button>
        <el-button type="success" @click="openDialog('success')">成功样式</el-button>
      </div>

      <div class="control-group">
        <h3>特殊样式</h3>
        <el-button type="warning" @click="openDialog('warning')">警告样式</el-button>
        <el-button type="danger" @click="openDialog('danger')">错误样式</el-button>
        <el-button @click="openDialog('gradient')">渐变样式</el-button>
      </div>
    </div>

    <!-- 默认对话框 -->
    <el-dialog
      v-model="dialogVisible.default"
      title="默认对话框"
      width="50%"
    >
      <p>这是一个默认样式的 Element Plus 对话框。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.default = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible.default = false">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 自定义样式对话框 -->
    <el-dialog
      v-model="dialogVisible.custom"
      title="自定义样式对话框"
      width="50%"
      class="custom-dialog"
    >
      <p>这是一个完全自定义样式的对话框。</p>
      <ul>
        <li>圆角边框</li>
        <li>渐变标题栏</li>
        <li>自定义阴影</li>
      </ul>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.custom = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible.custom = false">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 成功样式对话框 -->
    <el-dialog
      v-model="dialogVisible.success"
      title="操作成功"
      width="50%"
      class="success-dialog"
    >
      <div class="success-content">
        <el-icon color="#67C23A" :size="24">
          <Select />
        </el-icon>
        <span>您的操作已成功完成！</span>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.success = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 警告样式对话框 -->
    <el-dialog
      v-model="dialogVisible.warning"
      title="警告提示"
      width="50%"
      class="warning-dialog"
    >
      <div class="warning-content">
        <el-icon color="#E6A23C" :size="24">
          <Warning />
        </el-icon>
        <span>请注意，此操作可能会产生重要影响。</span>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.warning = false">取消</el-button>
          <el-button type="warning" @click="dialogVisible.warning = false">我了解风险</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 错误样式对话框 -->
    <el-dialog
      v-model="dialogVisible.danger"
      title="错误提示"
      width="50%"
      class="danger-dialog"
    >
      <div class="danger-content">
        <el-icon color="#F56C6C" :size="24">
          <CircleClose />
        </el-icon>
        <span>操作失败，请检查您的输入或网络连接。</span>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.danger = false">关闭</el-button>
          <el-button type="danger" @click="dialogVisible.danger = false">重新尝试</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 渐变样式对话框 -->
    <el-dialog
      v-model="dialogVisible.gradient"
      title="渐变样式对话框"
      width="50%"
      class="gradient-dialog"
    >
      <p>这是一个使用渐变背景的对话框。</p>
      <div class="gradient-content">
        <p>标题栏使用渐变色背景</p>
        <p>内容区域有特殊背景</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible.gradient = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible.gradient = false">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 代码示例 -->
    <div class="code-section">
      <h2>样式代码示例</h2>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="自定义对话框" name="custom">
          <pre class="code-block"><code>{{ customDialogCSS }}</code></pre>
        </el-tab-pane>
        <el-tab-pane label="成功对话框" name="success">
          <pre class="code-block"><code>{{ successDialogCSS }}</code></pre>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Select, Warning, CircleClose } from '@element-plus/icons-vue'

const activeTab = ref('custom')

const dialogVisible = reactive({
  default: false,
  custom: false,
  success: false,
  warning: false,
  danger: false,
  gradient: false
})

const openDialog = (type) => {
  dialogVisible[type] = true
}

const customDialogCSS = `/* 自定义对话框样式 */
.custom-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.custom-dialog .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 20px;
}

.custom-dialog .el-dialog__title {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.custom-dialog .el-dialog__headerbtn {
  top: 20px;
}

.custom-dialog .el-dialog__headerbtn .el-dialog__close {
  color: white;
  font-size: 18px;
}

.custom-dialog .el-dialog__body {
  padding: 30px;
  background: #f8f9fa;
}`

const successDialogCSS = `/* 成功对话框样式 */
.success-dialog {
  border-radius: 10px;
}

.success-dialog .el-dialog__header {
  background: #f6ffed;
  border-bottom: 2px solid #b7eb8f;
}

.success-dialog .el-dialog__title {
  color: #52c41a;
  font-weight: 600;
}

.success-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}`
</script>

<style scoped>
.el-dialog-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  color: white;
}

.header h1 {
  margin-bottom: 10px;
  font-size: 2rem;
}

.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.control-group {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-group h3 {
  margin-bottom: 15px;
  color: #409EFF;
}

.control-group .el-button {
  margin: 5px;
}

.code-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.code-section h2 {
  color: #409EFF;
  margin-bottom: 20px;
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  line-height: 1.5;
}

.success-content,
.warning-content,
.danger-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.gradient-content {
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
}
</style>

<style>
/* 全局样式 - 不使用 scoped */
.custom-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.custom-dialog .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 20px;
}

.custom-dialog .el-dialog__title {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.custom-dialog .el-dialog__headerbtn {
  top: 20px;
}

.custom-dialog .el-dialog__headerbtn .el-dialog__close {
  color: white;
  font-size: 18px;
}

.custom-dialog .el-dialog__body {
  padding: 30px;
  background: #f8f9fa;
}

.success-dialog {
  border-radius: 10px;
}

.success-dialog .el-dialog__header {
  background: #f6ffed;
  border-bottom: 2px solid #b7eb8f;
}

.success-dialog .el-dialog__title {
  color: #52c41a;
  font-weight: 600;
}

.warning-dialog .el-dialog__header {
  background: #fffbe6;
  border-bottom: 2px solid #ffe58f;
}

.warning-dialog .el-dialog__title {
  color: #faad14;
  font-weight: 600;
}

.danger-dialog .el-dialog__header {
  background: #fff2f0;
  border-bottom: 2px solid #ffccc7;
}

.danger-dialog .el-dialog__title {
  color: #ff4d4f;
  font-weight: 600;
}

.gradient-dialog {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.gradient-dialog .el-dialog__header {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  margin: 0;
  padding: 25px 30px;
}

.gradient-dialog .el-dialog__title {
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.gradient-dialog .el-dialog__body {
  background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);
  padding: 40px 30px;
}
</style>