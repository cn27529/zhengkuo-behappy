// scripts/testGitHash.js - 使用動態導入

async function testHashGeneration() {
  // 使用動態導入
  const {
    generateGitHash,
    generateRandomHash,
    generateMultipleHashes,
    testUniqueness,
  } = await import("../client/src/utils/generateGitHash.js");
  const hash_count = 100;
  console.log("=== 測試4碼Git哈希（hash）生成 ===");

  // 測試單個哈希（hash）
  const hash1 = generateGitHash();
  const hash2 = generateGitHash();
  console.log("有序哈希（hash）1:", hash1);
  console.log("有序哈希（hash）2:", hash2);
  console.log("長度驗證:", hash1.length === 4 && hash2.length === 4);
  console.log("唯一性驗證:", hash1 !== hash2);

  // 測試隨機哈希（hash）
  const randomHash = generateRandomHash();
  console.log("隨機哈希（hash）:", randomHash);

  // 測試批量生成
  const hashes = generateMultipleHashes(hash_count);
  console.log("批量哈希（hash）:", hashes);

  // 驗證十六進制格式
  const hexRegex = /^[0-9a-f]{4}$/;
  console.log(
    "格式驗證:",
    hashes.every((h) => hexRegex.test(h))
  );

  // 運行唯一性測試
  console.log("\n=== 唯一性測試 ===");
  await testUniqueness(hash_count);
}

// 執行測試
testHashGeneration().catch(console.error);
