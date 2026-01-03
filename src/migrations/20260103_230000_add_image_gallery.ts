import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_pages_blocks_image_gallery_layout_small" AS ENUM('row', 'grid', 'list');
    CREATE TYPE "public"."enum_pages_blocks_image_gallery_layout_medium" AS ENUM('row', 'grid', 'list');
    CREATE TYPE "public"."enum_pages_blocks_image_gallery_layout_large" AS ENUM('row', 'grid', 'list');
    CREATE TYPE "public"."enum_pages_blocks_image_gallery_layout_grid_columns" AS ENUM('2', '3', '4');
    CREATE TYPE "public"."enum__pages_v_blocks_image_gallery_layout_small" AS ENUM('row', 'grid', 'list');
    CREATE TYPE "public"."enum__pages_v_blocks_image_gallery_layout_medium" AS ENUM('row', 'grid', 'list');
    CREATE TYPE "public"."enum__pages_v_blocks_image_gallery_layout_large" AS ENUM('row', 'grid', 'list');
    CREATE TYPE "public"."enum__pages_v_blocks_image_gallery_layout_grid_columns" AS ENUM('2', '3', '4');

    CREATE TABLE "pages_blocks_image_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "layout_small" "enum_pages_blocks_image_gallery_layout_small" DEFAULT 'list',
      "layout_medium" "enum_pages_blocks_image_gallery_layout_medium" DEFAULT 'grid',
      "layout_large" "enum_pages_blocks_image_gallery_layout_large" DEFAULT 'grid',
      "layout_grid_columns" "enum_pages_blocks_image_gallery_layout_grid_columns" DEFAULT '3',
      "block_name" varchar
    );

    CREATE TABLE "pages_blocks_image_gallery_images" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "caption" varchar
    );

    CREATE TABLE "_pages_v_blocks_image_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "layout_small" "enum__pages_v_blocks_image_gallery_layout_small" DEFAULT 'list',
      "layout_medium" "enum__pages_v_blocks_image_gallery_layout_medium" DEFAULT 'grid',
      "layout_large" "enum__pages_v_blocks_image_gallery_layout_large" DEFAULT 'grid',
      "layout_grid_columns" "enum__pages_v_blocks_image_gallery_layout_grid_columns" DEFAULT '3',
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_pages_v_blocks_image_gallery_images" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "image_id" integer,
      "caption" varchar,
      "_uuid" varchar
    );

    ALTER TABLE "pages_blocks_image_gallery" ADD CONSTRAINT "pages_blocks_image_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "pages_blocks_image_gallery_images" ADD CONSTRAINT "pages_blocks_image_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "pages_blocks_image_gallery_images" ADD CONSTRAINT "pages_blocks_image_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_image_gallery"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_pages_v_blocks_image_gallery" ADD CONSTRAINT "_pages_v_blocks_image_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_pages_v_blocks_image_gallery_images" ADD CONSTRAINT "_pages_v_blocks_image_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_pages_v_blocks_image_gallery_images" ADD CONSTRAINT "_pages_v_blocks_image_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_image_gallery"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "pages_blocks_image_gallery_order_idx" ON "pages_blocks_image_gallery" USING btree ("_order");
    CREATE INDEX "pages_blocks_image_gallery_parent_id_idx" ON "pages_blocks_image_gallery" USING btree ("_parent_id");
    CREATE INDEX "pages_blocks_image_gallery_path_idx" ON "pages_blocks_image_gallery" USING btree ("_path");
    CREATE INDEX "pages_blocks_image_gallery_images_order_idx" ON "pages_blocks_image_gallery_images" USING btree ("_order");
    CREATE INDEX "pages_blocks_image_gallery_images_parent_id_idx" ON "pages_blocks_image_gallery_images" USING btree ("_parent_id");
    CREATE INDEX "pages_blocks_image_gallery_images_image_idx" ON "pages_blocks_image_gallery_images" USING btree ("image_id");
    CREATE INDEX "_pages_v_blocks_image_gallery_order_idx" ON "_pages_v_blocks_image_gallery" USING btree ("_order");
    CREATE INDEX "_pages_v_blocks_image_gallery_parent_id_idx" ON "_pages_v_blocks_image_gallery" USING btree ("_parent_id");
    CREATE INDEX "_pages_v_blocks_image_gallery_path_idx" ON "_pages_v_blocks_image_gallery" USING btree ("_path");
    CREATE INDEX "_pages_v_blocks_image_gallery_images_order_idx" ON "_pages_v_blocks_image_gallery_images" USING btree ("_order");
    CREATE INDEX "_pages_v_blocks_image_gallery_images_parent_id_idx" ON "_pages_v_blocks_image_gallery_images" USING btree ("_parent_id");
    CREATE INDEX "_pages_v_blocks_image_gallery_images_image_idx" ON "_pages_v_blocks_image_gallery_images" USING btree ("image_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "pages_blocks_image_gallery_images" CASCADE;
    DROP TABLE "pages_blocks_image_gallery" CASCADE;
    DROP TABLE "_pages_v_blocks_image_gallery_images" CASCADE;
    DROP TABLE "_pages_v_blocks_image_gallery" CASCADE;
    DROP TYPE "public"."enum_pages_blocks_image_gallery_layout_small";
    DROP TYPE "public"."enum_pages_blocks_image_gallery_layout_medium";
    DROP TYPE "public"."enum_pages_blocks_image_gallery_layout_large";
    DROP TYPE "public"."enum_pages_blocks_image_gallery_layout_grid_columns";
    DROP TYPE "public"."enum__pages_v_blocks_image_gallery_layout_small";
    DROP TYPE "public"."enum__pages_v_blocks_image_gallery_layout_medium";
    DROP TYPE "public"."enum__pages_v_blocks_image_gallery_layout_large";
    DROP TYPE "public"."enum__pages_v_blocks_image_gallery_layout_grid_columns";
  `)
}
