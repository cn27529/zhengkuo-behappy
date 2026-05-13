#!/usr/bin/env node
// 初始化 Meilisearch join_records 索引
// 用法：node setup-join-records.js

const HOST = 'http://localhost:7700';
const API_KEY = '1f42c220-3194-417e-a240-b054acfbfaaf';
const INDEX = 'join_records';

const data = require('./src/data/mock_join_records.json');

async function req(method, path, body) {
  const res = await fetch(`${HOST}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// 將 items 陣列展平為可搜尋的文字欄位
function flattenItems(record) {
  const names = [];
  const types = [];
  for (const item of record.items || []) {
    types.push(item.type);
    for (const s of item.sourceData || []) {
      if (s.name) names.push(s.name);
      if (s.surname) names.push(s.surname);
    }
  }
  return {
    ...record,
    _itemTypes: [...new Set(types)],
    _personNames: [...new Set(names)],
    _contactName: record.contact?.name || '',
    _contactMobile: record.contact?.mobile || '',
  };
}

async function main() {
  const docs = data.map(flattenItems);

  console.log(`推送 ${docs.length} 筆資料到索引 "${INDEX}"...`);
  const addResult = await req('POST', `/indexes/${INDEX}/documents`, docs);
  console.log('新增任務：', addResult);

  // 等待索引完成
  if (addResult.taskUid) {
    let task;
    do {
      await new Promise(r => setTimeout(r, 500));
      task = await req('GET', `/tasks/${addResult.taskUid}`);
    } while (task.status === 'enqueued' || task.status === 'processing');
    console.log('索引狀態：', task.status);
  }

  // 設定 searchable attributes（全文搜尋欄位）
  await req('PUT', `/indexes/${INDEX}/settings/searchable-attributes`, [
    '_contactName',
    '_contactMobile',
    '_personNames',
    'receiptNumber',
    'notes',
    'paymentNotes',
    'accountingNotes',
  ]);

  // 設定 filterable attributes（篩選欄位）
  await req('PUT', `/indexes/${INDEX}/settings/filterable-attributes`, [
    'state',
    'paymentState',
    'paymentMethod',
    'accountingState',
    'receiptIssued',
    'needReceipt',
    'activityId',
    '_itemTypes',
    'finalAmount',
    'paidAmount',
  ]);

  // 設定 sortable attributes
  await req('PUT', `/indexes/${INDEX}/settings/sortable-attributes`, [
    'createdAt',
    'finalAmount',
    'id',
  ]);

  console.log('✅ 設定完成');
}

main().catch(console.error);
