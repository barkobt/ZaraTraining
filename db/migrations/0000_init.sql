CREATE TABLE IF NOT EXISTS "participants" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "answers" jsonb NOT NULL,
  "total_score" integer NOT NULL,
  "cabin" varchar(50) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "participants_cabin_idx" ON "participants" ("cabin");
CREATE INDEX IF NOT EXISTS "participants_created_at_idx" ON "participants" ("created_at" DESC);
