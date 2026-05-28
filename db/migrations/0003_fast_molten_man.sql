CREATE TABLE "coefficient_samples" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"coefficient_type" varchar(30) NOT NULL,
	"date" date NOT NULL,
	"sampled_value" real NOT NULL,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coefficient_samples" ADD CONSTRAINT "coefficient_samples_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_coefficient_samples_type" ON "coefficient_samples" USING btree ("coefficient_type","applied_at");--> statement-breakpoint
CREATE INDEX "idx_coefficient_samples_store_date" ON "coefficient_samples" USING btree ("store_id","date");