ALTER TABLE matches
  ADD COLUMN reviewed TINYINT(1) NOT NULL DEFAULT 0 AFTER verification_attempts;