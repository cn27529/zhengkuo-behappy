CREATE TABLE "logEntryDB" (
    `id` char(36) PRIMARY KEY NOT NULL, # UUID 格式的唯一識別碼
    `user_created` char(36) NULL,
    `date_created` datetime NULL,
    `user_updated` char(36) NULL,
    `date_updated` datetime NULL,
    
    # 基本記錄欄位
    `timestamp` varchar(255) NOT NULL, # 操作時間戳記 (ISO 8601)
    `endpoint` varchar(500) NULL, # API 端點 URL
    `method` varchar(10) NULL, # HTTP 方法 (GET, POST, PUT, DELETE, PATCH)
    `status` integer NULL, # HTTP 狀態碼
    `statusText` varchar(100) NULL, # 狀態文字
    `duration` integer NULL DEFAULT '0', # 請求持續時間（毫秒）
    
    # 操作結果欄位
    `success` varchar(10) NULL DEFAULT 'false', # 操作是否成功 (true/false)
    `jsonParseError` varchar(10) NULL DEFAULT 'false', # JSON 解析是否錯誤
    `parseError` text NULL, # 解析錯誤訊息
    `error` varchar(10) NULL DEFAULT 'false', # 是否發生錯誤
    `errorText` text NULL, # 錯誤文字
    `errorMessage` text NULL, # 錯誤訊息
    `noContent` varchar(10) NULL DEFAULT 'false', # 是否無回應內容
    
    # 追蹤資訊
    `userAgent` text NULL, # 使用者代理字串（瀏覽器資訊）
    `url` varchar(500) NULL, # 前端頁面 URL
    
    # Context 核心欄位（操作上下文）
    `service` varchar(100) NULL, # 服務名稱 (ActivityService, RegistrationService 等)
    `operation` varchar(100) NULL, # 操作名稱 (createActivity, deleteActivity 等)
    `startTime` bigint NULL, # 操作開始時間戳記（Unix 毫秒）
    `contextMethod` varchar(10) NULL, # Context 中的 HTTP 方法
    `contextEndpoint` varchar(500) NULL, # Context 中的 API 端點
    `contextDuration` integer NULL, # Context 中的操作持續時間
    
    # 請求資料（重要：資料恢復來源）
    `requestBody` json NULL, # 完整的請求資料內容（用於資料恢復）
    
    # 完整 Context（包含所有上下文資訊）
    `context` json NULL, # 完整的操作上下文 JSON
    
    # 索引用欄位（用於快速查詢）
    `targetTable` varchar(100) NULL, # 目標資料表名稱 (activityDB, registrationDB 等)
    `targetId` integer NULL, # 目標資料 ID
    
    CONSTRAINT `logentrydb_user_created_foreign` FOREIGN KEY (`user_created`) REFERENCES `directus_users` (`id`),
    CONSTRAINT `logentrydb_user_updated_foreign` FOREIGN KEY (`user_updated`) REFERENCES `directus_users` (`id`)
);

-- 建立索引以提升查詢效能
CREATE INDEX `idx_logentry_timestamp` ON `logEntryDB` (`timestamp`);
CREATE INDEX `idx_logentry_service` ON `logEntryDB` (`service`);
CREATE INDEX `idx_logentry_operation` ON `logEntryDB` (`operation`);
CREATE INDEX `idx_logentry_method` ON `logEntryDB` (`method`);
CREATE INDEX `idx_logentry_status` ON `logEntryDB` (`status`);
CREATE INDEX `idx_logentry_success` ON `logEntryDB` (`success`);
CREATE INDEX `idx_logentry_error` ON `logEntryDB` (`error`);
CREATE INDEX `idx_logentry_target` ON `logEntryDB` (`targetTable`, `targetId`);
CREATE INDEX `idx_logentry_service_operation` ON `logEntryDB` (`service`, `operation`);

-- 複合索引用於常見查詢模式
CREATE INDEX `idx_logentry_timestamp_service` ON `logEntryDB` (`timestamp`, `service`);
CREATE INDEX `idx_logentry_timestamp_method` ON `logEntryDB` (`timestamp`, `method`);
