// delete-articles.js
import { createDirectus, rest, deleteCollection } from "@directus/sdk";

const client = createDirectus("http://localhost:3000").with(rest());

async function deleteArticlesCollection() {
  try {
    await client.request(deleteCollection("articles"));
    console.log("Articles collection deleted successfully");
  } catch (error) {
    console.error("Error deleting articles collection:", error);
  }
}

deleteArticlesCollection();
