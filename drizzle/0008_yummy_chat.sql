ALTER TABLE "courses" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_code_unique" UNIQUE("code");