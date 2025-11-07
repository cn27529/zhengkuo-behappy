// generateGitHashAsync.js
// Node.js only

// 運行環境判斷
const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";
const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

const hash_length = 7;
let sequenceCounter = 0;
const MAX_SEQUENCE = 65535;

// 延遲載入 Node.js crypto
let cryptoLib = null;
let cryptoInitialized = false;

/**
 * 初始化 crypto 庫
 */
async function initializeCrypto() {
  if (cryptoInitialized) return;

  try {
    if (isNode) {
      // 使用動態 import 替代 require
      const nodeCrypto = await import("crypto");
      cryptoLib = nodeCrypto.default || nodeCrypto;
    } else {
      // 瀏覽器環境
      cryptoLib = typeof window !== "undefined" ? window.crypto || {} : {};
    }
    console.log("Crypto 庫初始化成功");
  } catch (error) {
    console.warn("Crypto initialization failed:", error.message);
    cryptoLib = {};
  }

  cryptoInitialized = true;
}

/**
 * 簡單的字符串哈希函數 (瀏覽器環境備用)
 */
function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 轉為32位整數
  }
  return Math.abs(hash);
}

/**
 * 簡單隨機生成哈希（備用方案）
 */
function generateSimpleHash() {
  const chars = "0123456789abcdef";
  return Array.from({ length: hash_length })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

/**
 * Node.js 環境哈希
 */
function generateHashNode(input) {
  if (!cryptoLib?.createHash) {
    const hashValue = simpleHash(input);
    return hashValue
      .toString(16)
      .padStart(hash_length, "0")
      .substring(0, hash_length);
  }

  try {
    const hash = cryptoLib.createHash("sha1");
    hash.update(input);
    return hash.digest("hex").substring(0, hash_length);
  } catch (error) {
    console.warn("Node crypto failed, using simple hash:", error.message);
    const hashValue = simpleHash(input);
    return hashValue
      .toString(16)
      .padStart(hash_length, "0")
      .substring(0, hash_length);
  }
}

/**
 * 瀏覽器異步哈希 (使用 Web Crypto API)
 */
async function generateHashBrowser(input) {
  try {
    if (!cryptoLib?.subtle) throw new Error("No subtle crypto");
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await cryptoLib.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex.substring(0, hash_length);
  } catch {
    // 若 Web Crypto API 不可用
    const hashValue = simpleHash(input);
    return hashValue
      .toString(16)
      .padStart(hash_length, "0")
      .substring(0, hash_length);
  }
}

/**
 * 通用 Git Hash 生成（同步）- 不推薦在 Node 環境使用
 */
export function generateGitHash(data = "") {
  const input = data + Date.now().toString() + Math.random().toString();

  if (isNode) {
    // 在 Node 環境中，如果 crypto 未初始化，使用同步備用方案
    if (!cryptoInitialized || !cryptoLib?.createHash) {
      const hashValue = simpleHash(input);
      return hashValue
        .toString(16)
        .padStart(hash_length, "0")
        .substring(0, hash_length);
    }
    return generateHashNode(input);
  } else if (isBrowser) {
    // 瀏覽器用同步簡單哈希
    const hashValue = simpleHash(input);
    return hashValue
      .toString(16)
      .padStart(hash_length, "0")
      .substring(0, hash_length);
  } else {
    return generateSimpleHash();
  }
}

/**
 * 推薦的異步版本（Node + Browser 通用）
 */
export async function generateGitHashAsync(data = "") {
  await initializeCrypto();
  const input = data + Date.now().toString() + Math.random().toString();

  if (isNode) {
    return generateHashNode(input);
  } else {
    return await generateHashBrowser(input);
  }
}

/**
 * 產生多個哈希（同步）
 */
export function generateMultipleHashes(count = 5) {
  return Array.from({ length: count }, () => generateGitHash());
}

/**
 * 推薦的異步多哈希生成
 */
export async function generateMultipleHashesAsync(count = 5) {
  await initializeCrypto();
  const hashes = [];
  for (let i = 0; i < count; i++) {
    hashes.push(await generateGitHashAsync());
  }
  return hashes;
}

/**
 * 基於種子生成可重現的哈希
 */
export async function generateHashFromSeed(seed) {
  await initializeCrypto();

  if (isNode && cryptoLib?.createHash) {
    const hash = cryptoLib.createHash("sha1");
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
 * 隨機哈希
 */
export function generateRandomHash() {
  return generateSimpleHash();
}

/**
 * 時間序列哈希（有序唯一）
 */
export async function generateSequentialHash() {
  await initializeCrypto();
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 16);
  sequenceCounter = (sequenceCounter + 1) % MAX_SEQUENCE;
  const uniqueInput = `${timestamp}-${sequenceCounter}-${randomSuffix}`;

  if (isNode && cryptoLib?.createHash) {
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
 * Git哈希生成器類
 */
export class GitHashGenerator {
  constructor() {
    this.commitCount = 0;
  }

  async generate() {
    this.commitCount++;
    return await generateGitHashAsync(`commit-${this.commitCount}`);
  }

  reset() {
    this.commitCount = 0;
  }

  getCount() {
    return this.commitCount;
  }
}

/**
 * 延遲函式
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 測試唯一性（推薦使用異步版本）
 */
export async function testUniqueness(sampleSize = 100, useAsync = true) {
  console.log(
    `初始化 Crypto 庫...目前環境: isBrowser=${isBrowser}, isNode=${isNode}`
  );
  await initializeCrypto();

  const hashes = new Set();
  const duplicates = [];

  console.log(`測試 ${sampleSize} 個哈希的唯一性...`);

  const startTime = Date.now();

  for (let i = 0; i < sampleSize; i++) {
    const hash = useAsync
      ? await generateGitHashAsync(i.toString())
      : generateGitHash(i.toString());

    if (hashes.has(hash)) {
      duplicates.push({ hash, index: i + 1 });
      console.warn(`重複哈希: ${hash} (第 ${i + 1} 次)`);
    }
    hashes.add(hash);
  }

  const endTime = Date.now();
  console.log(`完成:
    - 總生成: ${sampleSize}
    - 唯一: ${hashes.size}
    - 重複: ${duplicates.length}
    - 重複率: ${((duplicates.length / sampleSize) * 100).toFixed(4)}%
    - 耗時: ${endTime - startTime}ms
    - 環境: ${isNode ? "Node.js" : isBrowser ? "Browser" : "Unknown"}
  `);

  return {
    total: sampleSize,
    unique: hashes.size,
    duplicates: duplicates.length,
    duplicateRate: (duplicates.length / sampleSize) * 100,
    duplicateList: duplicates,
  };
}

// 導出初始化函數
export { initializeCrypto };

export default generateGitHash;
