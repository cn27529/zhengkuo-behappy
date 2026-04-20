CREATE TABLE "joinRecordDB" (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `user_created` char(36) NULL,
    `date_created` datetime NULL,
    `user_updated` char(36) NULL,
    `date_updated` datetime NULL,
    `registrationId` integer null default '-1', # 登記表ID，registrationDB.id
    `activityId` integer null default '-1', # 活動ID，activityDB.id
    `state` varchar(255) null,
    `items` json null default '[]',
    `totalAmount` integer null default '0',
    `discountAmount` integer null default '0',
    `finalAmount` integer null default '0',
    `paidAmount` integer null default '0',
    `needReceipt` varchar(255) null default 'false', 
    `receiptNumber` varchar(255) null,
    `receiptIssued` varchar(255) null default '', # 經20260225決定修改定義默認為空值，值等於 "standard" 是 "感謝狀", "stamp" 是 "收據"，空值表示：未打印"收據"或"感謝狀"。
    `receiptIssuedAt` varchar(255) null,
    `receiptIssuedBy` varchar(255) null, # 收據開立者，也稱經手人
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
    `receiptId` integer null default '-1', # 打印ID，receiptNumberDB.id
    CONSTRAINT `joinRecorddb_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
    CONSTRAINT `joinRecorddb_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
  )
