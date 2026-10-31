USE kisumu_cbd;

ALTER TABLE notifications
  ADD COLUMN emailed TINYINT(1) NOT NULL DEFAULT 0 AFTER is_read;

UPDATE notifications SET emailed = 1;