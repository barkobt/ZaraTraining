CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(20),
	"entity_id" integer,
	"changes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "charts" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"shift_date" date NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"shift_data" jsonb NOT NULL,
	"chart_data" jsonb NOT NULL,
	"quality_score" real,
	"config_snapshot" jsonb,
	"status" varchar(20) DEFAULT 'generated' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "competencies" (
	"staff_id" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"level" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competencies_staff_id_role_pk" PRIMARY KEY("staff_id","role")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forbidden_role_pairs" (
	"store_id" integer NOT NULL,
	"role_a" varchar(20) NOT NULL,
	"role_b" varchar(20) NOT NULL,
	CONSTRAINT "forbidden_role_pairs_store_id_role_a_role_b_pk" PRIMARY KEY("store_id","role_a","role_b")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"answers" jsonb NOT NULL,
	"total_score" integer NOT NULL,
	"cabin" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solver_config" (
	"store_id" integer PRIMARY KEY NOT NULL,
	"competency_weight" real DEFAULT 3 NOT NULL,
	"fairness_weight" real DEFAULT 0.5 NOT NULL,
	"manager_morning_penalty" integer DEFAULT 500 NOT NULL,
	"manager_normal_penalty" integer DEFAULT 5000 NOT NULL,
	"dual_penalty" integer DEFAULT 800 NOT NULL,
	"sprinter_dual_penalty" integer DEFAULT 3000 NOT NULL,
	"buddy_violation_penalty" integer DEFAULT 2000 NOT NULL,
	"max_consecutive_hours" integer DEFAULT 2 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"full_name" varchar(100) NOT NULL,
	"short_name" varchar(30) NOT NULL,
	"tenure_level" varchar(20) NOT NULL,
	"is_manager" boolean DEFAULT false NOT NULL,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"note" text,
	"hire_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"section" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "charts" ADD CONSTRAINT "charts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forbidden_role_pairs" ADD CONSTRAINT "forbidden_role_pairs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solver_config" ADD CONSTRAINT "solver_config_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_charts_store_date" ON "charts" USING btree ("store_id","shift_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_competencies_staff" ON "competencies" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_staff_store" ON "staff" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "staff_store_short_name_unique" ON "staff" USING btree ("store_id","short_name");