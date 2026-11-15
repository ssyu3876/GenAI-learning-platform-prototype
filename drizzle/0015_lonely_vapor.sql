CREATE TABLE "assignment_group_members" (
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "assignment_group_members_unique" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "assignment_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_peer_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"score" integer,
	"feedback" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_peer_reviews_unique" UNIQUE("reviewer_id","submission_id")
);
--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD COLUMN "image_data" text;--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD COLUMN "image_mime_type" text;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD COLUMN "group_id" text;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "weight" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "group_size" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "peer_review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_group_members" ADD CONSTRAINT "assignment_group_members_group_id_assignment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."assignment_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_group_members" ADD CONSTRAINT "assignment_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_groups" ADD CONSTRAINT "assignment_groups_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_reviews" ADD CONSTRAINT "assignment_peer_reviews_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_reviews" ADD CONSTRAINT "assignment_peer_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_peer_reviews" ADD CONSTRAINT "assignment_peer_reviews_submission_id_assignment_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."assignment_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignment_groups_assignment_id_index" ON "assignment_groups" USING btree ("assignment_id");--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_group_id_assignment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."assignment_groups"("id") ON DELETE set null ON UPDATE no action;