import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_biography_alignment" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_biography_alignment" AS ENUM('left', 'right');
  ALTER TYPE "public"."enum_pages_hero_type" ADD VALUE 'heroSlider' BEFORE 'highImpact';
  ALTER TYPE "public"."enum__pages_v_version_hero_type" ADD VALUE 'heroSlider' BEFORE 'highImpact';
  CREATE TABLE "pages_blocks_biography" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"media_poster_image_id" integer,
  	"media_video_file_id" integer,
  	"alignment" "enum_pages_blocks_biography_alignment" DEFAULT 'left',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_biography" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" jsonb,
  	"media_poster_image_id" integer,
  	"media_video_file_id" integer,
  	"alignment" "enum__pages_v_blocks_biography_alignment" DEFAULT 'left',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_biography" ADD CONSTRAINT "pages_blocks_biography_media_poster_image_id_media_id_fk" FOREIGN KEY ("media_poster_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_biography" ADD CONSTRAINT "pages_blocks_biography_media_video_file_id_media_id_fk" FOREIGN KEY ("media_video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_biography" ADD CONSTRAINT "pages_blocks_biography_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_biography" ADD CONSTRAINT "_pages_v_blocks_biography_media_poster_image_id_media_id_fk" FOREIGN KEY ("media_poster_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_biography" ADD CONSTRAINT "_pages_v_blocks_biography_media_video_file_id_media_id_fk" FOREIGN KEY ("media_video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_biography" ADD CONSTRAINT "_pages_v_blocks_biography_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_biography_order_idx" ON "pages_blocks_biography" USING btree ("_order");
  CREATE INDEX "pages_blocks_biography_parent_id_idx" ON "pages_blocks_biography" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_biography_path_idx" ON "pages_blocks_biography" USING btree ("_path");
  CREATE INDEX "pages_blocks_biography_media_media_poster_image_idx" ON "pages_blocks_biography" USING btree ("media_poster_image_id");
  CREATE INDEX "pages_blocks_biography_media_media_video_file_idx" ON "pages_blocks_biography" USING btree ("media_video_file_id");
  CREATE INDEX "_pages_v_blocks_biography_order_idx" ON "_pages_v_blocks_biography" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_biography_parent_id_idx" ON "_pages_v_blocks_biography" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_biography_path_idx" ON "_pages_v_blocks_biography" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_biography_media_media_poster_image_idx" ON "_pages_v_blocks_biography" USING btree ("media_poster_image_id");
  CREATE INDEX "_pages_v_blocks_biography_media_media_video_file_idx" ON "_pages_v_blocks_biography" USING btree ("media_video_file_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_biography" CASCADE;
  DROP TABLE "_pages_v_blocks_biography" CASCADE;
  ALTER TABLE "pages" ALTER COLUMN "hero_type" SET DATA TYPE text;
  ALTER TABLE "pages" ALTER COLUMN "hero_type" SET DEFAULT 'lowImpact'::text;
  DROP TYPE "public"."enum_pages_hero_type";
  CREATE TYPE "public"."enum_pages_hero_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact');
  ALTER TABLE "pages" ALTER COLUMN "hero_type" SET DEFAULT 'lowImpact'::"public"."enum_pages_hero_type";
  ALTER TABLE "pages" ALTER COLUMN "hero_type" SET DATA TYPE "public"."enum_pages_hero_type" USING "hero_type"::"public"."enum_pages_hero_type";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_hero_type" SET DATA TYPE text;
  ALTER TABLE "_pages_v" ALTER COLUMN "version_hero_type" SET DEFAULT 'lowImpact'::text;
  DROP TYPE "public"."enum__pages_v_version_hero_type";
  CREATE TYPE "public"."enum__pages_v_version_hero_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact');
  ALTER TABLE "_pages_v" ALTER COLUMN "version_hero_type" SET DEFAULT 'lowImpact'::"public"."enum__pages_v_version_hero_type";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_hero_type" SET DATA TYPE "public"."enum__pages_v_version_hero_type" USING "version_hero_type"::"public"."enum__pages_v_version_hero_type";
  DROP TYPE "public"."enum_pages_blocks_biography_alignment";
  DROP TYPE "public"."enum__pages_v_blocks_biography_alignment";`)
}
