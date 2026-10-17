USE kisumu_cbd;

ALTER TABLE matches
  ADD COLUMN verification_attempts TINYINT NOT NULL DEFAULT 0 AFTER status;
  