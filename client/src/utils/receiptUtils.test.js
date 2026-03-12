// client/src/utils/receiptUtils.test.js

/**
 * receiptUtils 測試文件
 * 
 * 執行方式: node receiptUtils.test.js
 */

import { ReceiptUtils } from './receiptUtils.js';

// 簡單的測試框架
const tests = [];
let passCount = 0;
let failCount = 0;

function test(description, fn) {
  tests.push({ description, fn });
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual === expected) {
        passCount++;
        console.log(`✅ PASS: ${actual} === ${expected}`);
        return true;
      } else {
        failCount++;
        console.error(`❌ FAIL: Expected ${expected}, but got ${actual}`);
        return false;
      }
    },
    toEqual(expected) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr === expectedStr) {
        passCount++;
        console.log(`✅ PASS: ${actualStr} === ${expectedStr}`);
        return true;
      } else {
        failCount++;
        console.error(`❌ FAIL: Expected ${expectedStr}, but got ${actualStr}`);
        return false;
      }
    }
  };
}

// ========== 測試案例 ==========

test('normalizeNeedReceipt - 處理舊的 boolean true', () => {
  expect(ReceiptUtils.normalizeNeedReceipt(true)).toBe('standard');
});

test('normalizeNeedReceipt - 處理舊的 string "true"', () => {
  expect(ReceiptUtils.normalizeNeedReceipt('true')).toBe('standard');
});

test('normalizeNeedReceipt - 處理舊的 string "1"', () => {
  expect(ReceiptUtils.normalizeNeedReceipt('1')).toBe('standard');
});

test('normalizeNeedReceipt - 處理舊的 boolean false', () => {
  expect(ReceiptUtils.normalizeNeedReceipt(false)).toBe('');
});

test('normalizeNeedReceipt - 處理舊的 string "false"', () => {
  expect(ReceiptUtils.normalizeNeedReceipt('false')).toBe('');
});

test('normalizeNeedReceipt - 處理舊的 string "0"', () => {
  expect(ReceiptUtils.normalizeNeedReceipt('0')).toBe('');
});

test('normalizeNeedReceipt - 處理 null', () => {
  expect(ReceiptUtils.normalizeNeedReceipt(null)).toBe('');
});

test('normalizeNeedReceipt - 處理 undefined', () => {
  expect(ReceiptUtils.normalizeNeedReceipt(undefined)).toBe('');
});

test('normalizeNeedReceipt - 處理空字串', () => {
  expect(ReceiptUtils.normalizeNeedReceipt('')).toBe('');
});

test('normalizeNeedReceipt - 處理新的 "standard"', () => {
  expect(ReceiptUtils.normalizeNeedReceipt('standard')).toBe('standard');
});

test('normalizeNeedReceipt - 處理新的 "stamp"', () => {
  expect(ReceiptUtils.normalizeNeedReceipt('stamp')).toBe('stamp');
});

test('isNeedReceipt - 空字串應返回 false', () => {
  expect(ReceiptUtils.isNeedReceipt('')).toBe(false);
});

test('isNeedReceipt - "standard" 應返回 true', () => {
  expect(ReceiptUtils.isNeedReceipt('standard')).toBe(true);
});

test('isNeedReceipt - "stamp" 應返回 true', () => {
  expect(ReceiptUtils.isNeedReceipt('stamp')).toBe(true);
});

test('isNeedReceipt - 舊的 true 應返回 true', () => {
  expect(ReceiptUtils.isNeedReceipt(true)).toBe(true);
});

test('isNeedReceipt - 舊的 false 應返回 false', () => {
  expect(ReceiptUtils.isNeedReceipt(false)).toBe(false);
});

test('isStandard - "standard" 應返回 true', () => {
  expect(ReceiptUtils.isStandard('standard')).toBe(true);
});

test('isStandard - "stamp" 應返回 false', () => {
  expect(ReceiptUtils.isStandard('stamp')).toBe(false);
});

test('isStamp - "stamp" 應返回 true', () => {
  expect(ReceiptUtils.isStamp('stamp')).toBe(true);
});

test('isStamp - "standard" 應返回 false', () => {
  expect(ReceiptUtils.isStamp('standard')).toBe(false);
});

test('getReceiptTypeLabel - 空字串應返回 "不需要"', () => {
  expect(ReceiptUtils.getReceiptTypeLabel('')).toBe('不需要');
});

test('getReceiptTypeLabel - "standard" 應返回 "感謝狀"', () => {
  expect(ReceiptUtils.getReceiptTypeLabel('standard')).toBe('感謝狀');
});

test('getReceiptTypeLabel - "stamp" 應返回 "收據"', () => {
  expect(ReceiptUtils.getReceiptTypeLabel('stamp')).toBe('收據');
});

test('getReceiptTypeLabel - 舊的 true 應返回 "感謝狀"', () => {
  expect(ReceiptUtils.getReceiptTypeLabel(true)).toBe('感謝狀');
});

test('isValidReceiptType - 空字串應返回 true', () => {
  expect(ReceiptUtils.isValidReceiptType('')).toBe(true);
});

test('isValidReceiptType - "standard" 應返回 true', () => {
  expect(ReceiptUtils.isValidReceiptType('standard')).toBe(true);
});

test('isValidReceiptType - "stamp" 應返回 true', () => {
  expect(ReceiptUtils.isValidReceiptType('stamp')).toBe(true);
});

test('isValidReceiptType - "invalid" 應返回 false', () => {
  expect(ReceiptUtils.isValidReceiptType('invalid')).toBe(false);
});

test('getReceiptTypeFromTemplate - "standard" 應返回 "standard"', () => {
  expect(ReceiptUtils.getReceiptTypeFromTemplate('standard')).toBe('standard');
});

test('getReceiptTypeFromTemplate - "stamp" 應返回 "stamp"', () => {
  expect(ReceiptUtils.getReceiptTypeFromTemplate('stamp')).toBe('stamp');
});

test('getReceiptTypeFromTemplate - "other" 應返回 ""', () => {
  expect(ReceiptUtils.getReceiptTypeFromTemplate('other')).toBe('');
});

test('normalizeRecords - 批量標準化', () => {
  const records = [
    { id: 1, needReceipt: true },
    { id: 2, needReceipt: 'false' },
    { id: 3, needReceipt: 'standard' },
  ];
  const normalized = ReceiptUtils.normalizeRecords(records);
  expect(normalized[0].needReceipt).toBe('standard');
  expect(normalized[1].needReceipt).toBe('');
  expect(normalized[2].needReceipt).toBe('standard');
});

test('getReceiptTypeOptions - 應返回正確的選項陣列', () => {
  const options = ReceiptUtils.getReceiptTypeOptions();
  expect(options.length).toBe(3);
  expect(options[0].value).toBe('');
  expect(options[1].value).toBe('standard');
  expect(options[2].value).toBe('stamp');
});

// ========== 執行測試 ==========

console.log('\n🧪 開始執行 receiptUtils 測試...\n');

tests.forEach(({ description, fn }) => {
  console.log(`\n📝 測試: ${description}`);
  try {
    fn();
  } catch (error) {
    failCount++;
    console.error(`❌ 測試失敗: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 測試結果:`);
console.log(`   ✅ 通過: ${passCount}`);
console.log(`   ❌ 失敗: ${failCount}`);
console.log(`   📈 總計: ${passCount + failCount}`);
console.log(`   🎯 通過率: ${((passCount / (passCount + failCount)) * 100).toFixed(2)}%`);
console.log('\n' + '='.repeat(50) + '\n');

if (failCount === 0) {
  console.log('🎉 所有測試通過！\n');
  process.exit(0);
} else {
  console.log('⚠️  有測試失敗，請檢查！\n');
  process.exit(1);
}
