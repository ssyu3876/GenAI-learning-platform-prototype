CREATE TABLE "assignment_files" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"size" integer NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"points" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"text_content" text DEFAULT '' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"file_name" text,
	"mime_type" text,
	"file_size" integer,
	"file_data" text,
	"score" integer,
	"feedback" text DEFAULT '' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"graded_at" timestamp with time zone,
	"graded_by" text,
	CONSTRAINT "assignment_submissions_assignment_user_unique" UNIQUE("assignment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text,
	"week_no" integer DEFAULT 1 NOT NULL,
	"type" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"title" text NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"points" integer DEFAULT 100 NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_preferences" ADD COLUMN "assignment_published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_preferences" ADD COLUMN "assignment_reminder" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_preferences" ADD COLUMN "assignment_submitted" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_files" ADD CONSTRAINT "assignment_files_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD CONSTRAINT "assignment_questions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignment_questions_assignment_id_position_index" ON "assignment_questions" USING btree ("assignment_id","position");--> statement-breakpoint
CREATE INDEX "assignment_submissions_assignment_id_submitted_at_index" ON "assignment_submissions" USING btree ("assignment_id","submitted_at");--> statement-breakpoint
CREATE INDEX "assignments_class_id_due_at_index" ON "assignments" USING btree ("class_id","due_at");--> statement-breakpoint
CREATE INDEX "assignments_course_id_week_no_index" ON "assignments" USING btree ("course_id","week_no");