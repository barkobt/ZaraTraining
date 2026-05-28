CREATE TABLE "buenas_store_settings" (
	"store_id" integer PRIMARY KEY NOT NULL,
	"compran_target" real DEFAULT 0 NOT NULL,
	"gap_target" real DEFAULT 0 NOT NULL,
	"productivity_target" real DEFAULT 0 NOT NULL,
	"default_stretch" real DEFAULT 0.03 NOT NULL,
	"weekend_weight" real DEFAULT 1.75 NOT NULL,
	"weekend_day_factor" real DEFAULT 1.3 NOT NULL,
	"city" varchar(100) DEFAULT 'Bornova,Izmir' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buenas_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(30) NOT NULL,
	"pin_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"month" varchar(7) NOT NULL,
	"tier1_target_tl" real NOT NULL,
	"tier2_target_tl" real NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"avg_basket_tl" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coefficients" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(30) NOT NULL,
	"current_value" real NOT NULL,
	"default_value" real NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"last_suggested_value" real,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coefficients_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "daily_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" varchar(20) DEFAULT 'TASLAK' NOT NULL,
	"day_type" varchar(20) NOT NULL,
	"is_special_day" boolean DEFAULT false NOT NULL,
	"weather" varchar(20) DEFAULT 'normal' NOT NULL,
	"target_total_adet" integer,
	"target_total_tl" real,
	"target_reyon" jsonb,
	"target_ipod" jsonb,
	"planned_sint" real,
	"ref_total_adet" integer,
	"ref_total_tl" real,
	"ref_visit" integer,
	"ref_reyon" jsonb,
	"actual_total_adet" integer,
	"actual_total_tl" real,
	"actual_visit" integer,
	"actual_fis" integer,
	"actual_sint" real,
	"actual_gap" real,
	"dear_team_konusu" text,
	"gunun_sozu" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "special_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"coefficient" real DEFAULT 1.45 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "solver_config" ALTER COLUMN "competency_weight" SET DEFAULT 2;--> statement-breakpoint
ALTER TABLE "solver_config" ALTER COLUMN "fairness_weight" SET DEFAULT 0.3;--> statement-breakpoint
ALTER TABLE "solver_config" ALTER COLUMN "manager_morning_penalty" SET DEFAULT 50;--> statement-breakpoint
ALTER TABLE "solver_config" ALTER COLUMN "manager_normal_penalty" SET DEFAULT 500;--> statement-breakpoint
ALTER TABLE "solver_config" ALTER COLUMN "dual_penalty" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "solver_config" ALTER COLUMN "sprinter_dual_penalty" SET DEFAULT 300;--> statement-breakpoint
ALTER TABLE "solver_config" ALTER COLUMN "buddy_violation_penalty" SET DEFAULT 200;--> statement-breakpoint
ALTER TABLE "solver_config" ALTER COLUMN "max_consecutive_hours" SET DEFAULT 4;--> statement-breakpoint
ALTER TABLE "buenas_store_settings" ADD CONSTRAINT "buenas_store_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buenas_users" ADD CONSTRAINT "buenas_users_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_days" ADD CONSTRAINT "special_days_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_buenas_users_store_role" ON "buenas_users" USING btree ("store_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "buenas_challenges_store_month_unique" ON "challenges" USING btree ("store_id","month");--> statement-breakpoint
CREATE INDEX "idx_coefficients_type" ON "coefficients" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "buenas_daily_records_store_date_unique" ON "daily_records" USING btree ("store_id","date");--> statement-breakpoint
CREATE INDEX "idx_buenas_daily_records_status" ON "daily_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_buenas_daily_records_date" ON "daily_records" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_buenas_special_days_store_date" ON "special_days" USING btree ("store_id","start_date");