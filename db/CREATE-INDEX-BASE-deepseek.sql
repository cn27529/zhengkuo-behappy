-- -- registrationDB (登記主檔) 索引方案
-- 1. 外鍵關聯索引（關聯用戶查詢必備）
CREATE INDEX idx_registration_user_created ON registrationDB(user_created);
CREATE INDEX idx_registration_user_updated ON registrationDB(user_updated);

-- 2. 狀態與來源過濾（管理後台常用）
CREATE INDEX idx_registration_state ON registrationDB(state);
CREATE INDEX idx_registration_formSource ON registrationDB(formSource);

-- 3. 時間範圍查詢（報表統計）
CREATE INDEX idx_registration_date_created ON registrationDB(date_created);
CREATE INDEX idx_registration_date_updated ON registrationDB(date_updated);

-- 4. 表單識別查詢
CREATE INDEX idx_registration_formId ON registrationDB(formId);



-- -- participationRecordDB (參加記錄檔) 索引方案
-- 1. 核心外鍵關聯（跨表查詢必備）
CREATE INDEX idx_participation_registrationId ON participationRecordDB(registrationId);
CREATE INDEX idx_participation_activityId ON participationRecordDB(activityId);
CREATE INDEX idx_participation_user_created ON participationRecordDB(user_created);
CREATE INDEX idx_participation_user_updated ON participationRecordDB(user_updated);

-- 2. 業務狀態查詢（管理流程）
CREATE INDEX idx_participation_state ON participationRecordDB(state);
CREATE INDEX idx_participation_accountingState ON participationRecordDB(accountingState);
CREATE INDEX idx_participation_paymentState ON participationRecordDB(paymentState);
CREATE INDEX idx_participation_receiptIssued ON participationRecordDB(receiptIssued);

-- 3. 財務查詢（對賬、統計）
CREATE INDEX idx_participation_finalAmount ON participationRecordDB(finalAmount);
CREATE INDEX idx_participation_paidAmount ON participationRecordDB(paidAmount);

-- 4. 時間維度查詢
CREATE INDEX idx_participation_date_created ON participationRecordDB(date_created);
CREATE INDEX idx_participation_date_updated ON participationRecordDB(date_updated);

-- 5. 收據號查詢（唯一性可考慮UNIQUE約束）
CREATE INDEX idx_participation_receiptNumber ON participationRecordDB(receiptNumber) WHERE receiptNumber IS NOT NULL;


-- -- 如果出現以下查詢模式，可考慮添加聯合索引：
-- 場景：經常按「活動+狀態」查詢
CREATE INDEX idx_participation_activity_state ON participationRecordDB(activityId, state);

-- 場景：經常按「登記+活動」查詢
CREATE INDEX idx_participation_reg_activity ON participationRecordDB(registrationId, activityId);

-- 場景：財務報表按「狀態+時間」範圍查詢
CREATE INDEX idx_participation_state_date ON participationRecordDB(state, date_created);

-- 場景：按「會計狀態+付款狀態」篩選
CREATE INDEX idx_participation_account_payment ON participationRecordDB(accountingState, paymentState);