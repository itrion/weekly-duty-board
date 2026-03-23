CREATE TABLE "routine_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"routine_id" integer NOT NULL,
	"kid_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"time_info" text,
	"type" text NOT NULL,
	"required_days" jsonb NOT NULL,
	"icon" text,
	"points" integer DEFAULT 1 NOT NULL,
	"completion_mode" text DEFAULT 'all_or_nothing' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "completions" ALTER COLUMN "task_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "completions" ADD COLUMN "routine_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_assignments_routine_kid_unique" ON "routine_assignments" USING btree ("routine_id","kid_id");
--> statement-breakpoint
INSERT INTO "routines" ("id", "title", "time_info", "type", "required_days", "icon", "points", "completion_mode")
VALUES
  (1, 'Rutina de higiene de noche', 'Antes de dormir', 'daily', '[1,2,3,4,5,6,0]'::jsonb, 'bath', 1, 'all_or_nothing')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
SELECT setval('routines_id_seq', COALESCE((SELECT MAX(id) FROM "routines"), 1), true);
--> statement-breakpoint
INSERT INTO "routine_assignments" ("routine_id", "kid_id")
SELECT r.id, k.id
FROM (
  SELECT id FROM "routines" WHERE id = 1
) r
CROSS JOIN (
  SELECT id FROM "kids" ORDER BY id ASC LIMIT 1
) k
LEFT JOIN "routine_assignments" ra
  ON ra.routine_id = r.id AND ra.kid_id = k.id
WHERE ra.id IS NULL;
