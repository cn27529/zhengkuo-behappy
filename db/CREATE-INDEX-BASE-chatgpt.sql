-- registrationDB

CREATE INDEX idx_registration_date_created ON registrationDB (date_created);
CREATE INDEX idx_registration_state ON registrationDB (state);
CREATE INDEX idx_registration_user_created ON registrationDB (user_created);
CREATE INDEX idx_registration_form_id ON registrationDB (formId);

-- joinRecordDB
CREATE INDEX idx_participation_registration ON joinRecordDB (registrationId);
CREATE INDEX idx_participation_activity ON joinRecordDB (activityId);
CREATE INDEX idx_participation_date_created ON joinRecordDB (date_created);
CREATE INDEX idx_participation_payment_state ON joinRecordDB (paymentState);
CREATE INDEX idx_participation_accounting_state ON joinRecordDB (accountingState);
CREATE INDEX idx_participation_activity_payment ON joinRecordDB (activityId, paymentState);
CREATE INDEX idx_participation_activity_accounting ON joinRecordDB (activityId, accountingState);
CREATE INDEX idx_participation_registration_activity ON joinRecordDB (registrationId, activityId);
CREATE INDEX idx_participation_receiptNumber ON joinRecordDB(receiptNumber);