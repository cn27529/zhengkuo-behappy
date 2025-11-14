// delete-articles.js (CommonJS 版本)
const { createDirectus, rest, deleteCollection } = require("@directus/sdk");

const client = createDirectus("http://localhost:8055").with(rest());

async function deleteArticlesCollection() {
  try {
    await client.request(deleteCollection("articles"));
    console.log("Articles collection deleted successfully");
  } catch (error) {
    console.error("Error deleting articles collection:", error);
  }
}

deleteArticlesCollection();
