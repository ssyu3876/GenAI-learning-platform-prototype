CREATE TABLE "course_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"stage" text NOT NULL,
	"rating" integer,
	"difficulty" text,
	"comment" text DEFAULT '' NOT NULL,
	"lesson_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_generation_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request" jsonb NOT NULL,
	"outline" jsonb NOT NULL,
	"status" text DEFAULT 'outline' NOT NULL,
	"course_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_feedback" ADD CONSTRAINT "course_feedback_session_id_course_generation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."course_generation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_feedback" ADD CONSTRAINT "course_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_feedback" ADD CONSTRAINT "course_feedback_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_generation_sessions" ADD CONSTRAINT "course_generation_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_generation_sessions" ADD CONSTRAINT "course_generation_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_feedback_session_idx" ON "course_feedback" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "course_feedback_user_idx" ON "course_feedback" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "course_generation_sessions_user_idx" ON "course_generation_sessions" USING btree ("user_id","created_at");