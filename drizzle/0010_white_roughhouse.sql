CREATE TABLE "mail_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"recipient_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"class_id" text,
	"subject" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_user_state" (
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "mail_user_state_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "mail_messages" ADD COLUMN "thread_id" text;--> statement-breakpoint
ALTER TABLE "mail_messages" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "mail_drafts" ADD CONSTRAINT "mail_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_user_state" ADD CONSTRAINT "mail_user_state_message_id_mail_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."mail_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_user_state" ADD CONSTRAINT "mail_user_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_messages_thread_id_created_at_index" ON "mail_messages" USING btree ("thread_id","created_at");