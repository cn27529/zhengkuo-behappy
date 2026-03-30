CREATE TABLE "priceConfigDB" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_created" char(36) NULL,
    "date_created" datetime NULL,
    "user_updated" char(36) NULL,
    "date_updated" datetime NULL,
    "version" varchar(255) null,
    "state" varchar(255) null,
    "prices" json null,
    "notes" varchar(255) null,
    "enableDate" varchar(255) null,
    "createdAt" varchar(255) null,
    "updatedAt" varchar(255) null,
    CONSTRAINT "priceconfigdb_user_created_foreign" FOREIGN KEY ("user_created") REFERENCES "directus_users" ("id"),
    CONSTRAINT "priceconfigdb_user_updated_foreign" FOREIGN KEY ("user_updated") REFERENCES "directus_users" ("id")
);