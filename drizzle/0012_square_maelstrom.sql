CREATE TABLE "mail_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"course_approved" boolean DEFAULT true NOT NULL,
	"class_assigned" boolean DEFAULT true NOT NULL,
	"badge_earned" boolean DEFAULT true NOT NULL,
	"course_offline" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_awards" (
	"user_id" text NOT NULL,
	"badge_id" text NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badge_awards_user_id_badge_id_pk" PRIMARY KEY("user_id","badge_id")
);
--> statement-breakpoint
ALTER TABLE "mail_drafts" ADD COLUMN "cc_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_drafts" ADD COLUMN "bcc_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_messages" ADD COLUMN "cc_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_messages" ADD COLUMN "bcc_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_messages" ADD COLUMN "copy_type" text DEFAULT 'to' NOT NULL;--> statement-breakpoint
ALTER TABLE "mail_user_state" ADD COLUMN "purged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mail_preferences" ADD CONSTRAINT "mail_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;