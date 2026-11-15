ALTER TABLE "mail_preferences" ADD COLUMN "assignment_graded" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_preferences" ADD COLUMN "class_student_joined" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_preferences" ADD COLUMN "course_updated" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_preferences" ADD COLUMN "review_queue" boolean DEFAULT true NOT NULL;