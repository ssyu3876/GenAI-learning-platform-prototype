CREATE TABLE "class_insight_summaries" (
	"class_id" text PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"mocked" boolean DEFAULT false NOT NULL,
	"answer_count" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_insight_summaries" ADD CONSTRAINT "class_insight_summaries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;