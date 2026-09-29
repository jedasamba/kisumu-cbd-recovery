CREATE DATABASE IF NOT EXISTS kisumu_cbd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kisumu_cbd;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('resident', 'admin') NOT NULL DEFAULT 'resident',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  report_type ENUM('lost', 'found') NOT NULL,
  category VARCHAR(50) NOT NULL,
  brand VARCHAR(50) NULL,
  colour VARCHAR(30) NULL,
  description TEXT NULL,
  photo_url VARCHAR(255) NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  status ENUM('Reported', 'Match Found', 'Verification Pending',
              'Verified', 'Recovered', 'Closed') NOT NULL DEFAULT 'Reported',
  hidden_details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE qr_codes (
  qr_id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL UNIQUE,
  qr_code_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES item_reports(report_id) ON DELETE CASCADE
);

CREATE TABLE matches (
  match_id INT AUTO_INCREMENT PRIMARY KEY,
  lost_report_id INT NOT NULL,
  found_report_id INT NOT NULL,
  similarity_score DECIMAL(5,2) NOT NULL,
  status ENUM('Pending', 'Verified', 'Flagged') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lost_report_id) REFERENCES item_reports(report_id) ON DELETE CASCADE,
  FOREIGN KEY (found_report_id) REFERENCES item_reports(report_id) ON DELETE CASCADE
);

CREATE TABLE messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  sender_id INT NOT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  match_id INT NULL,
  type VARCHAR(50) NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);