// scripts/testGitHash.js
// 瀏覽器環境的版本 generateGitHash.js，Nodejs 環境使用異步版本 generateGitHashAsync.js

async function testHashGeneration() {
  // 使用動態導入
  const {
    generateGitHashAsync,
    generateRandomHash,
    generateMultipleHashesAsync,
    testUniqueness,
    initializeCrypto,
  } = await import("../client/src/utils/generateGitHashAsync.js");

  // 先初始化
  await initializeCrypto();

  const hash_count = 100; // 先測試少量
  console.log("=== 測試 7碼 Git 哈希生成 ===");

  // 測試單個哈希（使用異步版本）
  const hash1 = await generateGitHashAsync();
  const hash2 = await generateGitHashAsync();
  console.log("哈希 1:", hash1);
  console.log("哈希 2:", hash2);
  console.log("長度驗證:", hash1.length === 7 && hash2.length === 7);
  console.log("唯一性驗證:", hash1 !== hash2);

  // 測試隨機哈希
  const randomHash = generateRandomHash();
  console.log("隨機哈希:", randomHash);

  // 測試批量生成（異步版本）
  const hashes = await generateMultipleHashesAsync(hash_count);
  console.log("批量哈希:", hashes);

  // 驗證十六進制格式
  const hexRegex = /^[0-9a-f]{7}$/;
  console.log(
    "格式驗證:",
    hashes.every((h) => hexRegex.test(h))
  );

  // 運行唯一性測試
  console.log("\n=== 唯一性測試 ===");
  await testUniqueness(hash_count, true); // 使用異步版本
}

// 執行測試
testHashGeneration().catch(console.error);
