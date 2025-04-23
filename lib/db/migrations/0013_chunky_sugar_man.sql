ALTER TABLE "announcements" ADD COLUMN "schedule" timestamp;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "importance" varchar(16) DEFAULT 'normal' NOT NULL;