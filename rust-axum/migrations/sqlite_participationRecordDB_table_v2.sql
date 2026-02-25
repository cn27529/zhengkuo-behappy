CREATE TABLE "participationRecordDB" (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `user_created` char(36) NULL,
    `date_created` datetime NULL,
    `user_updated` char(36) NULL,
    `date_updated` datetime NULL,
    `registrationId` integer null default '-1', # 報名 ID，registrationDB.id
    `activityId` integer null default '-1', # 活動 ID，activityDB.id
    `state` varchar(255) null,
    `items` json null default '[]',
    `totalAmount` integer null default '0',
    `discountAmount` integer null default '0',
    `finalAmount` integer null default '0',
    `paidAmount` integer null default '0',
    `needReceipt` varchar(255) null default 'false', # 是否需要收據。經20260225決定修改定義默認為空值，有值時 值等於 "standard" 是 "感謝狀", "stamp" 是 "收據"。
    `receiptNumber` varchar(255) null,
    `receiptIssued` varchar(255) null default 'false',
    `receiptIssuedAt` varchar(255) null,
    `receiptIssuedBy` varchar(255) null,
    `accountingState` varchar(255) null,
    `accountingDate` varchar(255) null,
    `accountingBy` varchar(255) null,
    `accountingNotes` varchar(255) null,
    `paymentState` varchar(255) null,
    `paymentMethod` varchar(255) null,
    `paymentDate` varchar(255) null,
    `paymentNotes` varchar(255) null,
    `notes` varchar(255) null,
    `createdAt` varchar(255) null,
    `updatedAt` varchar(255) null,
    CONSTRAINT `participationrecorddb_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
    CONSTRAINT `participationrecorddb_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
  )
