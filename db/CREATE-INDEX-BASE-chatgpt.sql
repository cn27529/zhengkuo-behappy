-- registrationDB

CREATE INDEX idx_registration_date_created ON registrationDB (date_created);
CREATE INDEX idx_registration_state ON registrationDB (state);
CREATE INDEX idx_registration_user_created ON registrationDB (user_created);
CREATE INDEX idx_registration_form_id ON registrationDB (formId);

-- participationRecordDB
CREATE INDEX idx_participation_registration ON participationRecordDB (registrationId);
CREATE INDEX idx_participation_activity ON participationRecordDB (activityId);
CREATE INDEX idx_participation_date_created ON participationRecordDB (date_created);
CREATE INDEX idx_participation_payment_state ON participationRecordDB (paymentState);
CREATE INDEX idx_participation_accounting_state ON participationRecordDB (accountingState);
CREATE INDEX idx_participation_activity_payment ON participationRecordDB (activityId, paymentState);
CREATE INDEX idx_participation_activity_accounting ON participationRecordDB (activityId, accountingState);
CREATE INDEX idx_participation_registration_activity ON participationRecordDB (registrationId, activityId);
