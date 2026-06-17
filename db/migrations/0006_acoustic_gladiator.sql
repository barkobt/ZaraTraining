CREATE TABLE "pusula_aptitude_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"comp" varchar(30) NOT NULL,
	"from_level" varchar(20) NOT NULL,
	"to_level" varchar(20) NOT NULL,
	"evidence_channel" varchar(20),
	"evidence_n" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" text
);
--> statement-breakpoint
CREATE TABLE "pusula_archive_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"date" date NOT NULL,
	"kind" varchar(20) NOT NULL,
	"topic" varchar(120),
	"note" text NOT NULL,
	"author" varchar(100),
	"signed" boolean DEFAULT false NOT NULL,
	"tone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pusula_competencies" (
	"key" varchar(30) PRIMARY KEY NOT NULL,
	"label_tr" varchar(120) NOT NULL,
	"label_en" varchar(120) NOT NULL,
	"label_es" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pusula_competency_evals" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"competency" varchar(80) NOT NULL,
	"week" varchar(12) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"priority" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pusula_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"comp" varchar(30) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"n" integer DEFAULT 1 NOT NULL,
	"line" text,
	"observed_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pusula_glossary" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" varchar(120) NOT NULL,
	"type" varchar(40),
	"definition" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pusula_guidebook_progress" (
	"staff_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'Boş' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pusula_guidebook_progress_staff_id_topic_id_pk" PRIMARY KEY("staff_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "pusula_guidebook_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(30) NOT NULL,
	"level" varchar(20) NOT NULL,
	"category" varchar(30) NOT NULL,
	"no" integer NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pusula_mentor_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"mentee_id" integer NOT NULL,
	"focus" text,
	"reason" text,
	"shift" varchar(60),
	"slot" varchar(60),
	"confidence" varchar(20),
	"ai_suggested" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'suggested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pusula_period_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"week" varchar(12) NOT NULL,
	"priorities" jsonb,
	"goal" text,
	"action" text,
	"provenance" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pusula_person_competency" (
	"staff_id" integer NOT NULL,
	"comp" varchar(30) NOT NULL,
	"state" varchar(20) DEFAULT 'unexplored' NOT NULL,
	"proven_level" varchar(20),
	"teachable" boolean DEFAULT false NOT NULL,
	"evidence_n" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pusula_person_competency_staff_id_comp_pk" PRIMARY KEY("staff_id","comp")
);
--> statement-breakpoint
CREATE TABLE "pusula_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"period" varchar(30) NOT NULL,
	"strengths" jsonb,
	"growth" jsonb,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pusula_aptitude_suggestions" ADD CONSTRAINT "pusula_aptitude_suggestions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_archive_notes" ADD CONSTRAINT "pusula_archive_notes_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_competency_evals" ADD CONSTRAINT "pusula_competency_evals_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_evidence" ADD CONSTRAINT "pusula_evidence_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_guidebook_progress" ADD CONSTRAINT "pusula_guidebook_progress_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_guidebook_progress" ADD CONSTRAINT "pusula_guidebook_progress_topic_id_pusula_guidebook_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."pusula_guidebook_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_mentor_matches" ADD CONSTRAINT "pusula_mentor_matches_mentor_id_staff_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_mentor_matches" ADD CONSTRAINT "pusula_mentor_matches_mentee_id_staff_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_period_actions" ADD CONSTRAINT "pusula_period_actions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_person_competency" ADD CONSTRAINT "pusula_person_competency_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pusula_reports" ADD CONSTRAINT "pusula_reports_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pusula_aptitude_staff_status" ON "pusula_aptitude_suggestions" USING btree ("staff_id","status");--> statement-breakpoint
CREATE INDEX "idx_pusula_archive_notes_staff_date" ON "pusula_archive_notes" USING btree ("staff_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "pusula_comp_eval_staff_comp_week_unique" ON "pusula_competency_evals" USING btree ("staff_id","competency","week");--> statement-breakpoint
CREATE INDEX "idx_pusula_evidence_staff_comp" ON "pusula_evidence" USING btree ("staff_id","comp");--> statement-breakpoint
CREATE INDEX "idx_pusula_guidebook_topics_role_level" ON "pusula_guidebook_topics" USING btree ("role","level");--> statement-breakpoint
CREATE INDEX "idx_pusula_mentor_matches_mentor" ON "pusula_mentor_matches" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "idx_pusula_mentor_matches_mentee" ON "pusula_mentor_matches" USING btree ("mentee_id");--> statement-breakpoint
CREATE INDEX "idx_pusula_period_actions_staff_week" ON "pusula_period_actions" USING btree ("staff_id","week");--> statement-breakpoint
CREATE INDEX "idx_pusula_reports_staff_period" ON "pusula_reports" USING btree ("staff_id","period");