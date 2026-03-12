// src/stores/joinRecordReportStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useJoinRecordQueryStore } from "./joinRecordQueryStore.js";

export const useJoinRecordReportStore = defineStore("joinRecordReport", () => {
  const queryStore = useJoinRecordQueryStore();

  // 報表過濾條件
  const reportFilters = ref({
    dateRange: [],
    activityIds: [],
    accountingStates: [],
    receiptIssued: [],
    paymentStates: [],
    states: [],
    paymentMethods: []
  });

  // 可用欄位配置
  const availableColumns = ref([
    { key: 'id', label: '記錄ID', default: true },
    { key: 'registrationId', label: '登記ID', default: true },
    { key: 'contactName', label: '聯絡人', default: true },
    { key: 'contactMobile', label: '手機', default: true },
    { key: 'totalAmount', label: '總金額', default: true },
    { key: 'state', label: '記錄狀態', default: false },
    { key: 'paymentState', label: '付款狀態', default: true },
    { key: 'paymentMethod', label: '付款方式', default: false },
    { key: 'receiptIssued', label: '收據狀態', default: false },
    { key: 'accountingState', label: '會計狀態', default: false },
    { key: 'createdAt', label: '建立時間', default: false }
  ]);

  // 已選擇的欄位
  const selectedColumns = ref(
    availableColumns.value.filter(col => col.default).map(col => col.key)
  );

  // 報表數據
  const reportData = ref([]);
  const isLoading = ref(false);

  // 查詢報表數據
  const fetchReportData = async () => {
    isLoading.value = true;
    try {
      const queryData = {
        query: '',
        state: reportFilters.value.states.length ? reportFilters.value.states[0] : '',
      };

      const result = await queryStore.queryJoinRecordData(queryData);
      
      let filtered = result.data || [];

      // 日期過濾
      if (reportFilters.value.dateRange?.length === 2) {
        const [start, end] = reportFilters.value.dateRange;
        filtered = filtered.filter(r => {
          const date = new Date(r.createdAt);
          return date >= start && date <= end;
        });
      }

      // 活動過濾
      if (reportFilters.value.activityIds?.length) {
        filtered = filtered.filter(r => 
          reportFilters.value.activityIds.includes(r.activityId)
        );
      }

      // 付款狀態過濾
      if (reportFilters.value.paymentStates?.length) {
        filtered = filtered.filter(r => 
          reportFilters.value.paymentStates.includes(r.paymentState)
        );
      }

      // 收據狀態過濾
      if (reportFilters.value.receiptIssued?.length) {
        filtered = filtered.filter(r => 
          reportFilters.value.receiptIssued.includes(String(r.receiptIssued))
        );
      }

      // 會計狀態過濾
      if (reportFilters.value.accountingStates?.length) {
        filtered = filtered.filter(r => 
          reportFilters.value.accountingStates.includes(r.accountingState)
        );
      }

      // 付款方式過濾
      if (reportFilters.value.paymentMethods?.length) {
        filtered = filtered.filter(r => 
          reportFilters.value.paymentMethods.includes(r.paymentMethod)
        );
      }

      reportData.value = filtered;
      return { success: true, data: filtered };
    } finally {
      isLoading.value = false;
    }
  };

  // 提取欄位值
  const extractValue = (record, key) => {
    const map = {
      contactName: record.contact?.name || '',
      contactMobile: record.contact?.mobile || '',
      totalAmount: record.totalAmount || 0,
      receiptIssued: record.receiptIssued ? '已開立' : '未開立',
      createdAt: record.createdAt ? new Date(record.createdAt).toLocaleString('zh-TW') : ''
    };
    return map[key] ?? record[key] ?? '';
  };

  // 下載檔案
  const downloadFile = (content, filename, type) => {
    const blob = new Blob(['\ufeff' + content], { type: `${type};charset=utf-8;` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 匯出 CSV
  const exportCSV = () => {
    const headers = selectedColumns.value
      .map(key => availableColumns.value.find(col => col.key === key)?.label)
      .join(',');
    
    const rows = reportData.value.map(record => 
      selectedColumns.value.map(key => {
        const val = extractValue(record, key);
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    downloadFile(csv, `report_${Date.now()}.csv`, 'text/csv');
  };

  // 匯出 TXT
  const exportTXT = () => {
    const headers = selectedColumns.value
      .map(key => availableColumns.value.find(col => col.key === key)?.label)
      .join('\t');
    
    const rows = reportData.value.map(record => 
      selectedColumns.value.map(key => extractValue(record, key)).join('\t')
    );
    
    const txt = [headers, ...rows].join('\n');
    downloadFile(txt, `report_${Date.now()}.txt`, 'text/plain');
  };

  // 重置過濾條件
  const resetFilters = () => {
    reportFilters.value = {
      dateRange: [],
      activityIds: [],
      accountingStates: [],
      receiptIssued: [],
      paymentStates: [],
      states: [],
      paymentMethods: []
    };
    reportData.value = [];
  };

  return {
    // 狀態
    reportFilters,
    availableColumns,
    selectedColumns,
    reportData,
    isLoading,

    // 方法
    fetchReportData,
    exportCSV,
    exportTXT,
    resetFilters,

    // 從 queryStore 引用的配置
    stateConfigs: queryStore.stateConfigs,
  };
});
