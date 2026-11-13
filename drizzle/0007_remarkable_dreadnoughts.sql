CREATE TABLE "course_series" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request" jsonb NOT NULL,
	"plan" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_generation_sessions" ADD COLUMN "series_id" text;--> statement-breakpoint
ALTER TABLE "course_generation_sessions" ADD COLUMN "series_part" integer;--> statement-breakpoint
ALTER TABLE "course_series" ADD CONSTRAINT "course_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_series_user_idx" ON "course_series" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "course_generation_sessions" ADD CONSTRAINT "course_generation_sessions_series_id_course_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."course_series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_generation_sessions_series_idx" ON "course_generation_sessions" USING btree ("series_id");