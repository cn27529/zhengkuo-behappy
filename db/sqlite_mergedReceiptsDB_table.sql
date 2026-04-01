CREATE TABLE "mergedReceiptsDB" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_created" char(36) NULL,
    "date_created" datetime NULL,
    "user_updated" char(36) NULL,
    "date_updated" datetime NULL,
    "receiptNumber" varchar(255) null,
    "receiptType" varchar(255) null,
    "mergeIds" json null,
    "totalAmount" integer null,
    "issuedAt" varchar(255) null,
    "issuedBy" varchar(255) null,
    "notes" varchar(255) null,
    "createdAt" varchar(255) null,
    "updatedAt" varchar(255) null,
    CONSTRAINT "mergedreceiptsdb_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "directus_users" ("id"),
    CONSTRAINT "mergedreceiptsdb_user_updated_foreign" FOREIGN KEY ("user_updated") REFERENCES "directus_users" ("id")
);