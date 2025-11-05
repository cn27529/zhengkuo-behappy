import crypto from "crypto";

// 用於確保唯一性的計數器
let sequenceCounter = 0;
const MAX_SEQUENCE = 65535;
const hash_length = 7;

// 檢測運行環境
const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";
const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

/**
 * 簡單的字符串哈希函數 (瀏覽器環境備用)
 */
function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 轉換為32位整數
  }
  return Math.abs(hash);
}

/**
 * 簡單隨機生成哈希（備用方案）
 */
function generateSimpleHash() {
  const characters = "0123456789abcdef";
  let result = "";

  for (let i = 0; i < hash_length; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }

  return result;
}

/**
 * 瀏覽器環境的哈希生成
 */
async function generateHashBrowser(input) {
  try {
    const encoder = new TextEncoder();
    const inputData = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-1", inputData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex.substring(0, hash_length);
  } catch (error) {
    // 如果 Web Crypto API 失敗，使用簡單哈希
    const hashValue = simpleHash(input);
    return hashValue
      .toString(16)
      .padStart(hash_length, "0")
      .substring(0, hash_length);
  }
}

/**
 * Node.js 環境的哈希生成
 */
function generateHashNode(input) {
  const hash = crypto.createHash("sha1");
  hash.update(input);
  const fullHash = hash.digest("hex");
  return fullHash.substring(0, hash_length);
}

/**
 * 生成类似Git提交哈希的代码
 * @param {string} data - 可选的输入数据
 * @returns {string} 哈希值
 */
export function generateGitHash(data = "") {
  const input = data + Date.now().toString() + Math.random().toString();

  if (isNode) {
    return generateHashNode(input);
  } else if (isBrowser) {
    // 在瀏覽器環境中，我們使用同步的簡單哈希以避免異步問題
    const hashValue = simpleHash(input);
    return hashValue
      .toString(16)
      .padStart(hash_length, "0")
      .substring(0, hash_length);
  } else {
    // 未知環境使用簡單哈希
    return generateSimpleHash();
  }
}

/**
 * 瀏覽器專用的異步版本
 */
export async function generateGitHashBrowser(data = "") {
  const input = data + Date.now().toString() + Math.random().toString();
  return await generateHashBrowser(input);
}

/**
 * 生成多个哈希
 * @param {number} count - 要生成的哈希数量
 * @returns {string[]} 哈希数组
 */
export function generateMultipleHashes(count = 5) {
  const hashes = [];
  for (let i = 0; i < count; i++) {
    hashes.push(generateGitHash());
  }
  return hashes;
}

/**
 * 瀏覽器專用的異步多哈希生成
 */
export async function generateMultipleHashesBrowser(count = 5) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(generateGitHashBrowser());
  }
  return Promise.all(promises);
}

/**
 * 基于种子数据生成确定性哈希
 * @param {string} seed - 种子数据
 * @returns {string} 哈希
 */
export function generateHashFromSeed(seed) {
  if (isNode) {
    const hash = crypto.createHash("sha1");
    hash.update(seed);
    return hash.digest("hex").substring(0, hash_length);
  } else {
    const hashValue = simpleHash(seed);
    return hashValue
      .toString(16)
      .padStart(hash_length, "0")
      .substring(0, hash_length);
  }
}

/**
 * 傳統的完全隨機哈希（無順序性）
 */
export function generateRandomHash() {
  return generateSimpleHash();
}

/**
 * 基於時間戳生成有序但唯一的哈希
 */
export function generateSequentialHash() {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 16);
  sequenceCounter = (sequenceCounter + 1) % MAX_SEQUENCE;

  const uniqueInput = `${timestamp}-${sequenceCounter}-${randomSuffix}`;

  if (isNode) {
    return generateHashNode(uniqueInput);
  } else {
    const hashValue = simpleHash(uniqueInput);
    return hashValue
      .toString(16)
      .padStart(hash_length, "0")
      .substring(0, hash_length);
  }
}

/**
 * Git哈希生成器类
 */
export class GitHashGenerator {
  constructor() {
    this.commitCount = 0;
  }

  /**
   * 生成带计数器的哈希
   * @returns {string} 哈希
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

// 基本的sleep函數
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 測試哈希生成器的唯一性
 */
export function testUniqueness(sampleSize = 100) {
  const hashes = new Set();
  const duplicates = [];

  console.log(`測試 ${sampleSize} 個哈希的唯一性...`);

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
    - 總生成: ${sampleSize} 個哈希
    - 唯一哈希: ${hashes.size} 個
    - 重複數量: ${duplicates.length}
    - 重複率: ${((duplicates.length / sampleSize) * 100).toFixed(4)}%
    - 耗時: ${endTime - startTime}ms
    - 環境: ${isNode ? "Node.js" : isBrowser ? "Browser" : "Unknown"}
  `);

  return {
    total: sampleSize,
    unique: hashes.size,
    duplicates: duplicates.length,
    duplicateRate: (duplicates.length / sampleSize) * 100,
  };
}

export default generateGitHash;
