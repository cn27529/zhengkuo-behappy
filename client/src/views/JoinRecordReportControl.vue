<template>
  <div class="report-control">
    <el-card class="filter-card">
      <template #header>查詢條件</template>
      <el-form :model="store.reportFilters" label-width="100px" size="default">
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="日期區間">
              <el-date-picker
                v-model="store.reportFilters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="開始日期"
                end-placeholder="結束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="10">
            <el-form-item>
              <el-button
                type="primary"
                @click="handleQuery"
                :loading="store.isLoading"
                >查詢</el-button
              >
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="記錄狀態">
              <el-select
                v-model="store.reportFilters.states"
                multiple
                collapse-tags
                style="width: 100px"
              >
                <el-option
                  v-for="opt in store.stateConfigs.state.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="付款狀態">
              <el-select
                v-model="store.reportFilters.paymentStates"
                multiple
                collapse-tags
                style="width: 100px"
              >
                <el-option
                  v-for="opt in store.stateConfigs.paymentState.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="收據狀態">
              <el-select
                v-model="store.reportFilters.receiptIssued"
                multiple
                collapse-tags
                style="width: 100px"
              >
                <el-option
                  v-for="opt in store.stateConfigs.receiptIssued.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="會計狀態">
              <el-select
                v-model="store.reportFilters.accountingStates"
                multiple
                collapse-tags
                style="width: 100px"
              >
                <el-option
                  v-for="opt in store.stateConfigs.accountingState.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="付款方式">
              <el-select
                v-model="store.reportFilters.paymentMethods"
                multiple
                collapse-tags
                style="width: 100px"
              >
                <el-option
                  v-for="opt in store.stateConfigs.paymentMethod.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="column-card">
      <template #header>選擇匯出欄位</template>
      <el-checkbox-group v-model="store.selectedColumns">
        <el-checkbox
          v-for="col in store.availableColumns"
          :key="col.key"
          :label="col.key"
        >
          {{ col.label }}
        </el-checkbox>
      </el-checkbox-group>
    </el-card>

    <el-card class="result-card">
      <template #header>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <span>查詢結果 ({{ store.reportData.length }} 筆)</span>
          <div>
            <el-button
              size="small"
              @click="store.exportCSV"
              :disabled="!store.reportData.length"
            >
              匯出 CSV
            </el-button>
            <el-button
              size="small"
              @click="store.exportTXT"
              :disabled="!store.reportData.length"
            >
              匯出 TXT
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="store.reportData"
        v-loading="store.isLoading"
        stripe
        border
        max-height="500"
      >
        <el-table-column
          v-for="key in store.selectedColumns"
          :key="key"
          :label="store.availableColumns.find((c) => c.key === key)?.label"
          :min-width="getColumnWidth(key)"
        >
          <template #default="{ row }">
            {{ formatValue(row, key) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { useJoinRecordReportStore } from "../stores/joinRecordReportStore.js";
import { ElMessage } from "element-plus";

const store = useJoinRecordReportStore();

const handleQuery = async () => {
  const result = await store.fetchReportData();
  if (result.success) {
    ElMessage.success(`查詢成功，共 ${result.data.length} 筆資料`);
  } else {
    ElMessage.error("查詢失敗");
  }
};

const handleReset = () => {
  store.resetFilters();
};

const formatValue = (row, key) => {
  if (key === "contactName") return row.contact?.name || "";
  if (key === "contactMobile") return row.contact?.mobile || "";
  if (key === "receiptIssued") return row.receiptIssued ? "已開立" : "未開立";
  if (key === "createdAt")
    return row.createdAt ? new Date(row.createdAt).toLocaleString("zh-TW") : "";
  return row[key] ?? "";
};

const getColumnWidth = (key) => {
  const widthMap = {
    id: 30,
    registrationId: 30,
    contactName: 50,
    contactMobile: 50,
    totalAmount: 50,
    state: 50,
    paymentState: 50,
    paymentMethod: 50,
    receiptIssued: 50,
    accountingState: 50,
    createdAt: 50,
  };
  return widthMap[key] || 30;
};
</script>

<style scoped>
.report-control {
  padding: 20px;
}

.filter-card,
.column-card,
.result-card {
  margin-bottom: 20px;
}

.column-card :deep(.el-checkbox) {
  margin-right: 20px;
  margin-bottom: 10px;
}
</style>
