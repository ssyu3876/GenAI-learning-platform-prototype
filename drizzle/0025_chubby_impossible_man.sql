CREATE TABLE "course_request_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_request_drafts" ADD CONSTRAINT "course_request_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_request_drafts_user_idx" ON "course_request_drafts" USING btree ("user_id","created_at");