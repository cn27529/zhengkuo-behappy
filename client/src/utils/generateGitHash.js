import crypto from "crypto";

// 用於確保唯一性的計數器
let sequenceCounter = 0;
const MAX_SEQUENCE = 65535;
const hash_length = 7;

/**
 * 生成类似Git提交哈希（hash）的4位代码
 * @param {string} data - 可选的输入数据
 * @returns {string} 4位十六进制哈希（hash）值
 */
export function generateGitHash(data = "") {
  const input = data + Date.now().toString() + Math.random().toString();
  const hash = crypto.createHash("sha1");
  hash.update(input);
  const fullHash = hash.digest("hex");

  // 返回前4个字符
  return fullHash.substring(0, hash_length);
}

// 基本的sleep函數
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成多个4码哈希（hash）
 * @param {number} count - 要生成的哈希（hash）数量
 * @returns {string[]} 哈希（hash）数组
 */
export function generateMultipleHashes(count = 5) {
  const hashes = [];
  for (let i = 0; i < count; i++) {
    hashes.push(generateGitHash());
  }
  return hashes;
}

/**
 * 基于种子数据生成确定性哈希（hash）
 * @param {string} seed - 种子数据
 * @returns {string} 4位哈希（hash）
 */
export function generateHashFromSeed(seed) {
  const hash = crypto.createHash("sha1");
  hash.update(seed);
  return hash.digest("hex").substring(0, hash_length);
}

/**
 * Git哈希（hash）生成器类
 */
export class GitHashGenerator {
  constructor() {
    this.commitCount = 0;
  }

  /**
   * 生成带计数器的哈希（hash）
   * @returns {string} 4位哈希（hash）
   */
  generate() {
    this.commitCount++;
    return generateGitHash(`commit-${this.commitCount}`);
  }

  /**
   * 重置计数器
   */
  reset() {
    this.commitCount = 0;
  }

  /**
   * 获取当前计数
   * @returns {number}
   */
  getCount() {
    return this.commitCount;
  }
}

export default generateGitHash;

/**
 * 浏览器兼容版本的4码哈希（hash）生成
 */

/**
 * 生成4码Git风格的哈希（hash）值（浏览器版本）
 * @param {string} data - 可选的输入数据
 * @returns {Promise<string>} 4位十六进制哈希（hash）值
 */
export async function generateGitHashBrowser(data = "") {
  const input = data + Date.now().toString() + Math.random().toString();
  const encoder = new TextEncoder();
  const inputData = encoder.encode(input);

  try {
    const hashBuffer = await crypto.subtle.digest("SHA-1", inputData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex.substring(0, hash_length);
  } catch (error) {
    // 备用方案：简单随机生成
    return generateSimpleHash();
  }
}

/**
 * 傳統的完全隨機哈希（hash）（無順序性）
 */
export function generateRandomHash() {
  return generateSimpleHash();
}

/**
 * 基於時間戳生成有序但唯一的4碼哈希（hash）
 */
function generateSequentialHash() {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 16);
  sequenceCounter = (sequenceCounter + 1) % MAX_SEQUENCE;

  const uniqueInput = `${timestamp}-${sequenceCounter}-${randomSuffix}`;
  return generateHashFromInput(uniqueInput);
}

/**
 * 從輸入數據生成哈希（hash）
 */
function generateHashFromInput(input) {
  // 簡單的哈希（hash）函數，基於字符串生成4位哈希（hash）
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 轉換為32位整數
  }

  // 轉換為4位十六進制
  return Math.abs(hash).toString(16).padStart(4, "0").substring(0, hash_length);
}

/**
 * 測試哈希（hash）生成器的唯一性
 */
export function testUniqueness(sampleSize = 100) {
  const hashes = new Set();
  const duplicates = [];

  console.log(`測試 ${sampleSize} 個哈希（hash）的唯一性...`);

  const startTime = Date.now();
  const array = [...Array(sampleSize).keys()];

  array.forEach((data) => {
    const hash = generateGitHash(data);
    if (hashes.has(hash)) {
      duplicates.push(hash);
      console.warn(`發現重複哈希（hash）: ${hash} (第 ${data + 1} 次)`);
    }
    hashes.add(hash);
  });

  const endTime = Date.now();

  console.log(`測試完成:
    - 總生成: ${sampleSize} 個哈希（hash）
    - 唯一哈希（hash）: ${hashes.size} 個
    - 重複數量: ${duplicates.length}
    - 重複率: ${((duplicates.length / sampleSize) * 100).toFixed(4)}%
    - 耗時: ${endTime - startTime}ms
  `);

  return {
    total: sampleSize,
    unique: hashes.size,
    duplicates: duplicates.length,
    duplicateRate: (duplicates.length / sampleSize) * 100,
  };
}

/**
 * 简单随机生成4码哈希（hash）（备用方案）
 * @returns {string} 4位哈希（hash）
 */
function generateSimpleHash() {
  const characters = "0123456789abcdef";
  let result = "";

  for (let i = 0; i < 4; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }

  return result;
}

/**
 * 生成多个哈希（hash）（浏览器版本）
 * @param {number} count - 数量
 * @returns {Promise<string[]>} 哈希（hash）数组
 */
export async function generateMultipleHashesBrowser(count = 5) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(generateGitHashBrowser());
  }
  return Promise.all(promises);
}
