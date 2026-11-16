ALTER TABLE "course_generation_sessions" ADD COLUMN "origin" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_generation_sessions" ADD COLUMN "source_lesson_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "course_generation_sessions" ADD COLUMN "confusion" text DEFAULT '' NOT NULL;