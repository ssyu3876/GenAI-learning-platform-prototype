CREATE TABLE "assignment_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"assignment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'due24h' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_reminders_unique" UNIQUE("assignment_id","user_id","kind")
);
--> statement-breakpoint
CREATE TABLE "class_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"weeks" integer DEFAULT 16 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_terms_classId_unique" UNIQUE("class_id")
);
--> statement-breakpoint
ALTER TABLE "assignment_reminders" ADD CONSTRAINT "assignment_reminders_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_reminders" ADD CONSTRAINT "assignment_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_terms" ADD CONSTRAINT "class_terms_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_terms" ADD CONSTRAINT "class_terms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;