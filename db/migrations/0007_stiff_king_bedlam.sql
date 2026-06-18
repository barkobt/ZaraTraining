CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(40) NOT NULL,
	"event_type" varchar(30) NOT NULL,
	"path" varchar(200) NOT NULL,
	"element" varchar(120),
	"meta" jsonb,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_analytics_events_session" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_type_created" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_path" ON "analytics_events" USING btree ("path");