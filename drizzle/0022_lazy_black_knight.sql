CREATE TABLE "activity_attempt_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" text NOT NULL,
	"course_id" text NOT NULL,
	"score" integer NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_attempt_history" ADD CONSTRAINT "activity_attempt_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_attempt_history" ADD CONSTRAINT "activity_attempt_history_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_attempt_history" ADD CONSTRAINT "activity_attempt_history_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_attempt_history_user_idx" ON "activity_attempt_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_attempt_history_activity_idx" ON "activity_attempt_history" USING btree ("activity_id","created_at");