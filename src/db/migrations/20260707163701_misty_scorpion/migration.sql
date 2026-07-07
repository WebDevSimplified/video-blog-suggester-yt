CREATE TYPE "content_type" AS ENUM('video', 'article');--> statement-breakpoint
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"description" text NOT NULL,
	"publish_date" date NOT NULL,
	"url" text NOT NULL UNIQUE,
	"thumbnail_url" text NOT NULL,
	"type" "content_type" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"content_id" uuid NOT NULL,
	"start_position" integer,
	"embedding" vector(1536) NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "content_url_idx" ON "content" ("url");--> statement-breakpoint
CREATE INDEX "chunks_contentId_idx" ON "chunks" ("content_id");--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_content_id_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE;