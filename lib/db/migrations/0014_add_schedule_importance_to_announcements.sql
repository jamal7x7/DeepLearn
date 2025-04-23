ALTER TABLE announcements ADD COLUMN schedule TIMESTAMP;
ALTER TABLE announcements ADD COLUMN importance VARCHAR(16) DEFAULT 'normal' NOT NULL;
