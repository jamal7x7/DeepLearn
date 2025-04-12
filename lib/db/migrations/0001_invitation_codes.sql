-- Add invitation_codes table
CREATE TABLE IF NOT EXISTS "invitation_codes" (
  "id" serial PRIMARY KEY,
  "team_id" integer NOT NULL,
  "code" varchar(20) NOT NULL UNIQUE,
  "created_by" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp,
  "max_uses" integer DEFAULT 1,
  "used_count" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  CONSTRAINT "invitation_codes_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE,
  CONSTRAINT "invitation_codes_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX "invitation_codes_team_id_idx" ON "invitation_codes" ("team_id");
CREATE INDEX "invitation_codes_code_idx" ON "invitation_codes" ("code");

-- Add invitation_code_uses table to track who used which code
CREATE TABLE IF NOT EXISTS "invitation_code_uses" (
  "id" serial PRIMARY KEY,
  "code_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "used_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "invitation_code_uses_code_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."invitation_codes"("id") ON DELETE CASCADE,
  CONSTRAINT "invitation_code_uses_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- Add index for faster lookups
CREATE INDEX "invitation_code_uses_code_id_idx" ON "invitation_code_uses" ("code_id");
CREATE INDEX "invitation_code_uses_user_id_idx" ON "invitation_code_uses" ("user_id");