import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create enum types for works blocks
    CREATE TYPE "public"."enum_works_blocks_biography_alignment" AS ENUM('left', 'right');
    CREATE TYPE "public"."enum_works_blocks_cta_links_link_type" AS ENUM('reference', 'custom');
    CREATE TYPE "public"."enum_works_blocks_cta_links_link_appearance" AS ENUM('default', 'outline');
    CREATE TYPE "public"."enum_works_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
    CREATE TYPE "public"."enum_works_blocks_content_columns_link_type" AS ENUM('reference', 'custom');
    CREATE TYPE "public"."enum_works_blocks_content_columns_link_appearance" AS ENUM('default', 'outline');
    CREATE TYPE "public"."enum_works_blocks_archive_populate_by" AS ENUM('collection', 'selection');
    CREATE TYPE "public"."enum_works_blocks_archive_relation_to" AS ENUM('posts');
    CREATE TYPE "public"."enum_works_status" AS ENUM('draft', 'published');

    -- Create enum types for works versions
    CREATE TYPE "public"."enum__works_v_blocks_biography_alignment" AS ENUM('left', 'right');
    CREATE TYPE "public"."enum__works_v_blocks_cta_links_link_type" AS ENUM('reference', 'custom');
    CREATE TYPE "public"."enum__works_v_blocks_cta_links_link_appearance" AS ENUM('default', 'outline');
    CREATE TYPE "public"."enum__works_v_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
    CREATE TYPE "public"."enum__works_v_blocks_content_columns_link_type" AS ENUM('reference', 'custom');
    CREATE TYPE "public"."enum__works_v_blocks_content_columns_link_appearance" AS ENUM('default', 'outline');
    CREATE TYPE "public"."enum__works_v_blocks_archive_populate_by" AS ENUM('collection', 'selection');
    CREATE TYPE "public"."enum__works_v_blocks_archive_relation_to" AS ENUM('posts');
    CREATE TYPE "public"."enum__works_v_version_status" AS ENUM('draft', 'published');

    -- Create works blocks tables
    CREATE TABLE "works_blocks_biography" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar,
      "body" jsonb,
      "media_poster_image_id" integer,
      "media_video_file_id" integer,
      "alignment" "enum_works_blocks_biography_alignment" DEFAULT 'left',
      "block_name" varchar
    );

    CREATE TABLE "works_blocks_cta_links" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "link_type" "enum_works_blocks_cta_links_link_type" DEFAULT 'reference',
      "link_new_tab" boolean,
      "link_url" varchar,
      "link_label" varchar,
      "link_appearance" "enum_works_blocks_cta_links_link_appearance" DEFAULT 'default'
    );

    CREATE TABLE "works_blocks_cta" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "rich_text" jsonb,
      "block_name" varchar
    );

    CREATE TABLE "works_blocks_content_columns" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "size" "enum_works_blocks_content_columns_size" DEFAULT 'oneThird',
      "rich_text" jsonb,
      "enable_link" boolean,
      "link_type" "enum_works_blocks_content_columns_link_type" DEFAULT 'reference',
      "link_new_tab" boolean,
      "link_url" varchar,
      "link_label" varchar,
      "link_appearance" "enum_works_blocks_content_columns_link_appearance" DEFAULT 'default'
    );

    CREATE TABLE "works_blocks_content" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE "works_blocks_media_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "media_id" integer,
      "block_name" varchar
    );

    CREATE TABLE "works_blocks_archive" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "intro_content" jsonb,
      "populate_by" "enum_works_blocks_archive_populate_by" DEFAULT 'collection',
      "relation_to" "enum_works_blocks_archive_relation_to" DEFAULT 'posts',
      "limit" numeric DEFAULT 10,
      "block_name" varchar
    );

    CREATE TABLE "works_blocks_form_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "form_id" integer,
      "enable_intro" boolean,
      "intro_content" jsonb,
      "block_name" varchar
    );

    CREATE TABLE "works_blocks_works_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar,
      "description" varchar,
      "block_name" varchar
    );

    -- Create main works table
    CREATE TABLE "works" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "thumbnail_id" integer,
      "description" varchar,
      "hero_image_id" integer,
      "meta_title" varchar,
      "meta_image_id" integer,
      "meta_description" varchar,
      "published_at" timestamp(3) with time zone,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_works_status" DEFAULT 'draft'
    );

    -- Create works relationships table
    CREATE TABLE "works_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "works_id" integer,
      "categories_id" integer
    );

    -- Create works versions blocks tables
    CREATE TABLE "_works_v_blocks_biography" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "body" jsonb,
      "media_poster_image_id" integer,
      "media_video_file_id" integer,
      "alignment" "enum__works_v_blocks_biography_alignment" DEFAULT 'left',
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_works_v_blocks_cta_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "link_type" "enum__works_v_blocks_cta_links_link_type" DEFAULT 'reference',
      "link_new_tab" boolean,
      "link_url" varchar,
      "link_label" varchar,
      "link_appearance" "enum__works_v_blocks_cta_links_link_appearance" DEFAULT 'default',
      "_uuid" varchar
    );

    CREATE TABLE "_works_v_blocks_cta" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "rich_text" jsonb,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_works_v_blocks_content_columns" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "size" "enum__works_v_blocks_content_columns_size" DEFAULT 'oneThird',
      "rich_text" jsonb,
      "enable_link" boolean,
      "link_type" "enum__works_v_blocks_content_columns_link_type" DEFAULT 'reference',
      "link_new_tab" boolean,
      "link_url" varchar,
      "link_label" varchar,
      "link_appearance" "enum__works_v_blocks_content_columns_link_appearance" DEFAULT 'default',
      "_uuid" varchar
    );

    CREATE TABLE "_works_v_blocks_content" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_works_v_blocks_media_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "media_id" integer,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_works_v_blocks_archive" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "intro_content" jsonb,
      "populate_by" "enum__works_v_blocks_archive_populate_by" DEFAULT 'collection',
      "relation_to" "enum__works_v_blocks_archive_relation_to" DEFAULT 'posts',
      "limit" numeric DEFAULT 10,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_works_v_blocks_form_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "form_id" integer,
      "enable_intro" boolean,
      "intro_content" jsonb,
      "_uuid" varchar,
      "block_name" varchar
    );

    CREATE TABLE "_works_v_blocks_works_block" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "description" varchar,
      "_uuid" varchar,
      "block_name" varchar
    );

    -- Create works versions table
    CREATE TABLE "_works_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar,
      "version_thumbnail_id" integer,
      "version_description" varchar,
      "version_hero_image_id" integer,
      "version_meta_title" varchar,
      "version_meta_image_id" integer,
      "version_meta_description" varchar,
      "version_published_at" timestamp(3) with time zone,
      "version_generate_slug" boolean DEFAULT true,
      "version_slug" varchar,
      "version__status" "enum__works_v_version_status" DEFAULT 'draft',
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "snapshot" boolean,
      "published_locale" varchar,
      "latest" boolean,
      "autosave" boolean
    );

    -- Create works versions relationships table
    CREATE TABLE "_works_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "works_id" integer,
      "categories_id" integer
    );

    -- Add foreign key constraints for works blocks
    ALTER TABLE "works_blocks_biography" ADD CONSTRAINT "works_blocks_biography_media_poster_image_id_media_id_fk" FOREIGN KEY ("media_poster_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "works_blocks_biography" ADD CONSTRAINT "works_blocks_biography_media_video_file_id_media_id_fk" FOREIGN KEY ("media_video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "works_blocks_biography" ADD CONSTRAINT "works_blocks_biography_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "works_blocks_cta_links" ADD CONSTRAINT "works_blocks_cta_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "works_blocks_cta" ADD CONSTRAINT "works_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "works_blocks_content_columns" ADD CONSTRAINT "works_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works_blocks_content"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "works_blocks_content" ADD CONSTRAINT "works_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "works_blocks_media_block" ADD CONSTRAINT "works_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "works_blocks_media_block" ADD CONSTRAINT "works_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "works_blocks_archive" ADD CONSTRAINT "works_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "works_blocks_form_block" ADD CONSTRAINT "works_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "works_blocks_form_block" ADD CONSTRAINT "works_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "works_blocks_works_block" ADD CONSTRAINT "works_blocks_works_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;

    -- Add foreign key constraints for main works table
    ALTER TABLE "works" ADD CONSTRAINT "works_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "works" ADD CONSTRAINT "works_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "works" ADD CONSTRAINT "works_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

    -- Add foreign key constraints for works relationships
    ALTER TABLE "works_rels" ADD CONSTRAINT "works_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "works_rels" ADD CONSTRAINT "works_rels_works_fk" FOREIGN KEY ("works_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "works_rels" ADD CONSTRAINT "works_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;

    -- Add foreign key constraints for works versions blocks
    ALTER TABLE "_works_v_blocks_biography" ADD CONSTRAINT "_works_v_blocks_biography_media_poster_image_id_media_id_fk" FOREIGN KEY ("media_poster_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_works_v_blocks_biography" ADD CONSTRAINT "_works_v_blocks_biography_media_video_file_id_media_id_fk" FOREIGN KEY ("media_video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_works_v_blocks_biography" ADD CONSTRAINT "_works_v_blocks_biography_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_works_v_blocks_cta_links" ADD CONSTRAINT "_works_v_blocks_cta_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_works_v_blocks_cta" ADD CONSTRAINT "_works_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_works_v_blocks_content_columns" ADD CONSTRAINT "_works_v_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v_blocks_content"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_works_v_blocks_content" ADD CONSTRAINT "_works_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_works_v_blocks_media_block" ADD CONSTRAINT "_works_v_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_works_v_blocks_media_block" ADD CONSTRAINT "_works_v_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_works_v_blocks_archive" ADD CONSTRAINT "_works_v_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_works_v_blocks_form_block" ADD CONSTRAINT "_works_v_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_works_v_blocks_form_block" ADD CONSTRAINT "_works_v_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_works_v_blocks_works_block" ADD CONSTRAINT "_works_v_blocks_works_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_works_v"("id") ON DELETE cascade ON UPDATE no action;

    -- Add foreign key constraints for works versions main table
    ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_parent_id_works_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."works"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_thumbnail_id_media_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_works_v" ADD CONSTRAINT "_works_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

    -- Add foreign key constraints for works versions relationships
    ALTER TABLE "_works_v_rels" ADD CONSTRAINT "_works_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_works_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_works_v_rels" ADD CONSTRAINT "_works_v_rels_works_fk" FOREIGN KEY ("works_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_works_v_rels" ADD CONSTRAINT "_works_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;

    -- Create indexes for works blocks
    CREATE INDEX "works_blocks_biography_order_idx" ON "works_blocks_biography" USING btree ("_order");
    CREATE INDEX "works_blocks_biography_parent_id_idx" ON "works_blocks_biography" USING btree ("_parent_id");
    CREATE INDEX "works_blocks_biography_path_idx" ON "works_blocks_biography" USING btree ("_path");
    CREATE INDEX "works_blocks_biography_media_media_poster_image_idx" ON "works_blocks_biography" USING btree ("media_poster_image_id");
    CREATE INDEX "works_blocks_biography_media_media_video_file_idx" ON "works_blocks_biography" USING btree ("media_video_file_id");

    CREATE INDEX "works_blocks_cta_links_order_idx" ON "works_blocks_cta_links" USING btree ("_order");
    CREATE INDEX "works_blocks_cta_links_parent_id_idx" ON "works_blocks_cta_links" USING btree ("_parent_id");

    CREATE INDEX "works_blocks_cta_order_idx" ON "works_blocks_cta" USING btree ("_order");
    CREATE INDEX "works_blocks_cta_parent_id_idx" ON "works_blocks_cta" USING btree ("_parent_id");
    CREATE INDEX "works_blocks_cta_path_idx" ON "works_blocks_cta" USING btree ("_path");

    CREATE INDEX "works_blocks_content_columns_order_idx" ON "works_blocks_content_columns" USING btree ("_order");
    CREATE INDEX "works_blocks_content_columns_parent_id_idx" ON "works_blocks_content_columns" USING btree ("_parent_id");

    CREATE INDEX "works_blocks_content_order_idx" ON "works_blocks_content" USING btree ("_order");
    CREATE INDEX "works_blocks_content_parent_id_idx" ON "works_blocks_content" USING btree ("_parent_id");
    CREATE INDEX "works_blocks_content_path_idx" ON "works_blocks_content" USING btree ("_path");

    CREATE INDEX "works_blocks_media_block_order_idx" ON "works_blocks_media_block" USING btree ("_order");
    CREATE INDEX "works_blocks_media_block_parent_id_idx" ON "works_blocks_media_block" USING btree ("_parent_id");
    CREATE INDEX "works_blocks_media_block_path_idx" ON "works_blocks_media_block" USING btree ("_path");
    CREATE INDEX "works_blocks_media_block_media_idx" ON "works_blocks_media_block" USING btree ("media_id");

    CREATE INDEX "works_blocks_archive_order_idx" ON "works_blocks_archive" USING btree ("_order");
    CREATE INDEX "works_blocks_archive_parent_id_idx" ON "works_blocks_archive" USING btree ("_parent_id");
    CREATE INDEX "works_blocks_archive_path_idx" ON "works_blocks_archive" USING btree ("_path");

    CREATE INDEX "works_blocks_form_block_order_idx" ON "works_blocks_form_block" USING btree ("_order");
    CREATE INDEX "works_blocks_form_block_parent_id_idx" ON "works_blocks_form_block" USING btree ("_parent_id");
    CREATE INDEX "works_blocks_form_block_path_idx" ON "works_blocks_form_block" USING btree ("_path");
    CREATE INDEX "works_blocks_form_block_form_idx" ON "works_blocks_form_block" USING btree ("form_id");

    CREATE INDEX "works_blocks_works_block_order_idx" ON "works_blocks_works_block" USING btree ("_order");
    CREATE INDEX "works_blocks_works_block_parent_id_idx" ON "works_blocks_works_block" USING btree ("_parent_id");
    CREATE INDEX "works_blocks_works_block_path_idx" ON "works_blocks_works_block" USING btree ("_path");

    -- Create indexes for main works table
    CREATE INDEX "works_thumbnail_idx" ON "works" USING btree ("thumbnail_id");
    CREATE INDEX "works_hero_image_idx" ON "works" USING btree ("hero_image_id");
    CREATE INDEX "works_meta_meta_image_idx" ON "works" USING btree ("meta_image_id");
    CREATE INDEX "works_slug_idx" ON "works" USING btree ("slug");
    CREATE INDEX "works_updated_at_idx" ON "works" USING btree ("updated_at");
    CREATE INDEX "works_created_at_idx" ON "works" USING btree ("created_at");
    CREATE INDEX "works__status_idx" ON "works" USING btree ("_status");

    -- Create indexes for works relationships
    CREATE INDEX "works_rels_order_idx" ON "works_rels" USING btree ("order");
    CREATE INDEX "works_rels_parent_idx" ON "works_rels" USING btree ("parent_id");
    CREATE INDEX "works_rels_path_idx" ON "works_rels" USING btree ("path");
    CREATE INDEX "works_rels_works_id_idx" ON "works_rels" USING btree ("works_id");
    CREATE INDEX "works_rels_categories_id_idx" ON "works_rels" USING btree ("categories_id");

    -- Create indexes for works versions blocks
    CREATE INDEX "_works_v_blocks_biography_order_idx" ON "_works_v_blocks_biography" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_biography_parent_id_idx" ON "_works_v_blocks_biography" USING btree ("_parent_id");
    CREATE INDEX "_works_v_blocks_biography_path_idx" ON "_works_v_blocks_biography" USING btree ("_path");
    CREATE INDEX "_works_v_blocks_biography_media_media_poster_image_idx" ON "_works_v_blocks_biography" USING btree ("media_poster_image_id");
    CREATE INDEX "_works_v_blocks_biography_media_media_video_file_idx" ON "_works_v_blocks_biography" USING btree ("media_video_file_id");

    CREATE INDEX "_works_v_blocks_cta_links_order_idx" ON "_works_v_blocks_cta_links" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_cta_links_parent_id_idx" ON "_works_v_blocks_cta_links" USING btree ("_parent_id");

    CREATE INDEX "_works_v_blocks_cta_order_idx" ON "_works_v_blocks_cta" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_cta_parent_id_idx" ON "_works_v_blocks_cta" USING btree ("_parent_id");
    CREATE INDEX "_works_v_blocks_cta_path_idx" ON "_works_v_blocks_cta" USING btree ("_path");

    CREATE INDEX "_works_v_blocks_content_columns_order_idx" ON "_works_v_blocks_content_columns" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_content_columns_parent_id_idx" ON "_works_v_blocks_content_columns" USING btree ("_parent_id");

    CREATE INDEX "_works_v_blocks_content_order_idx" ON "_works_v_blocks_content" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_content_parent_id_idx" ON "_works_v_blocks_content" USING btree ("_parent_id");
    CREATE INDEX "_works_v_blocks_content_path_idx" ON "_works_v_blocks_content" USING btree ("_path");

    CREATE INDEX "_works_v_blocks_media_block_order_idx" ON "_works_v_blocks_media_block" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_media_block_parent_id_idx" ON "_works_v_blocks_media_block" USING btree ("_parent_id");
    CREATE INDEX "_works_v_blocks_media_block_path_idx" ON "_works_v_blocks_media_block" USING btree ("_path");
    CREATE INDEX "_works_v_blocks_media_block_media_idx" ON "_works_v_blocks_media_block" USING btree ("media_id");

    CREATE INDEX "_works_v_blocks_archive_order_idx" ON "_works_v_blocks_archive" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_archive_parent_id_idx" ON "_works_v_blocks_archive" USING btree ("_parent_id");
    CREATE INDEX "_works_v_blocks_archive_path_idx" ON "_works_v_blocks_archive" USING btree ("_path");

    CREATE INDEX "_works_v_blocks_form_block_order_idx" ON "_works_v_blocks_form_block" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_form_block_parent_id_idx" ON "_works_v_blocks_form_block" USING btree ("_parent_id");
    CREATE INDEX "_works_v_blocks_form_block_path_idx" ON "_works_v_blocks_form_block" USING btree ("_path");
    CREATE INDEX "_works_v_blocks_form_block_form_idx" ON "_works_v_blocks_form_block" USING btree ("form_id");

    CREATE INDEX "_works_v_blocks_works_block_order_idx" ON "_works_v_blocks_works_block" USING btree ("_order");
    CREATE INDEX "_works_v_blocks_works_block_parent_id_idx" ON "_works_v_blocks_works_block" USING btree ("_parent_id");
    CREATE INDEX "_works_v_blocks_works_block_path_idx" ON "_works_v_blocks_works_block" USING btree ("_path");

    -- Create indexes for works versions main table
    CREATE INDEX "_works_v_parent_idx" ON "_works_v" USING btree ("parent_id");
    CREATE INDEX "_works_v_version_thumbnail_idx" ON "_works_v" USING btree ("version_thumbnail_id");
    CREATE INDEX "_works_v_version_hero_image_idx" ON "_works_v" USING btree ("version_hero_image_id");
    CREATE INDEX "_works_v_version_meta_meta_image_idx" ON "_works_v" USING btree ("version_meta_image_id");
    CREATE INDEX "_works_v_version_version_slug_idx" ON "_works_v" USING btree ("version_slug");
    CREATE INDEX "_works_v_version_version_updated_at_idx" ON "_works_v" USING btree ("version_updated_at");
    CREATE INDEX "_works_v_version_version_created_at_idx" ON "_works_v" USING btree ("version_created_at");
    CREATE INDEX "_works_v_version_version__status_idx" ON "_works_v" USING btree ("version__status");
    CREATE INDEX "_works_v_created_at_idx" ON "_works_v" USING btree ("created_at");
    CREATE INDEX "_works_v_updated_at_idx" ON "_works_v" USING btree ("updated_at");
    CREATE INDEX "_works_v_snapshot_idx" ON "_works_v" USING btree ("snapshot");
    CREATE INDEX "_works_v_published_locale_idx" ON "_works_v" USING btree ("published_locale");
    CREATE INDEX "_works_v_latest_idx" ON "_works_v" USING btree ("latest");
    CREATE INDEX "_works_v_autosave_idx" ON "_works_v" USING btree ("autosave");

    -- Create indexes for works versions relationships
    CREATE INDEX "_works_v_rels_order_idx" ON "_works_v_rels" USING btree ("order");
    CREATE INDEX "_works_v_rels_parent_idx" ON "_works_v_rels" USING btree ("parent_id");
    CREATE INDEX "_works_v_rels_path_idx" ON "_works_v_rels" USING btree ("path");
    CREATE INDEX "_works_v_rels_works_id_idx" ON "_works_v_rels" USING btree ("works_id");
    CREATE INDEX "_works_v_rels_categories_id_idx" ON "_works_v_rels" USING btree ("categories_id");

    -- Add works_id column to payload_locked_documents_rels table
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "works_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_works_fk" FOREIGN KEY ("works_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_works_id_idx" ON "payload_locked_documents_rels" USING btree ("works_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop works_id from payload_locked_documents_rels
    DROP INDEX IF EXISTS "payload_locked_documents_rels_works_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_works_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "works_id";

    -- Drop indexes
    DROP INDEX IF EXISTS "_works_v_rels_categories_id_idx";
    DROP INDEX IF EXISTS "_works_v_rels_works_id_idx";
    DROP INDEX IF EXISTS "_works_v_rels_path_idx";
    DROP INDEX IF EXISTS "_works_v_rels_parent_idx";
    DROP INDEX IF EXISTS "_works_v_rels_order_idx";
    DROP INDEX IF EXISTS "_works_v_autosave_idx";
    DROP INDEX IF EXISTS "_works_v_latest_idx";
    DROP INDEX IF EXISTS "_works_v_published_locale_idx";
    DROP INDEX IF EXISTS "_works_v_snapshot_idx";
    DROP INDEX IF EXISTS "_works_v_updated_at_idx";
    DROP INDEX IF EXISTS "_works_v_created_at_idx";
    DROP INDEX IF EXISTS "_works_v_version_version__status_idx";
    DROP INDEX IF EXISTS "_works_v_version_version_created_at_idx";
    DROP INDEX IF EXISTS "_works_v_version_version_updated_at_idx";
    DROP INDEX IF EXISTS "_works_v_version_version_slug_idx";
    DROP INDEX IF EXISTS "_works_v_version_meta_meta_image_idx";
    DROP INDEX IF EXISTS "_works_v_version_hero_image_idx";
    DROP INDEX IF EXISTS "_works_v_version_thumbnail_idx";
    DROP INDEX IF EXISTS "_works_v_parent_idx";
    DROP INDEX IF EXISTS "works_rels_categories_id_idx";
    DROP INDEX IF EXISTS "works_rels_works_id_idx";
    DROP INDEX IF EXISTS "works_rels_path_idx";
    DROP INDEX IF EXISTS "works_rels_parent_idx";
    DROP INDEX IF EXISTS "works_rels_order_idx";
    DROP INDEX IF EXISTS "works__status_idx";
    DROP INDEX IF EXISTS "works_created_at_idx";
    DROP INDEX IF EXISTS "works_updated_at_idx";
    DROP INDEX IF EXISTS "works_slug_idx";
    DROP INDEX IF EXISTS "works_meta_meta_image_idx";
    DROP INDEX IF EXISTS "works_hero_image_idx";
    DROP INDEX IF EXISTS "works_thumbnail_idx";

    -- Drop tables
    DROP TABLE IF EXISTS "_works_v_rels" CASCADE;
    DROP TABLE IF EXISTS "_works_v" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_works_block" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_form_block" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_archive" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_media_block" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_content" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_content_columns" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_cta" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_cta_links" CASCADE;
    DROP TABLE IF EXISTS "_works_v_blocks_biography" CASCADE;
    DROP TABLE IF EXISTS "works_rels" CASCADE;
    DROP TABLE IF EXISTS "works" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_works_block" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_form_block" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_archive" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_media_block" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_content" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_content_columns" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_cta" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_cta_links" CASCADE;
    DROP TABLE IF EXISTS "works_blocks_biography" CASCADE;

    -- Drop enum types
    DROP TYPE IF EXISTS "public"."enum__works_v_version_status";
    DROP TYPE IF EXISTS "public"."enum__works_v_blocks_archive_relation_to";
    DROP TYPE IF EXISTS "public"."enum__works_v_blocks_archive_populate_by";
    DROP TYPE IF EXISTS "public"."enum__works_v_blocks_content_columns_link_appearance";
    DROP TYPE IF EXISTS "public"."enum__works_v_blocks_content_columns_link_type";
    DROP TYPE IF EXISTS "public"."enum__works_v_blocks_content_columns_size";
    DROP TYPE IF EXISTS "public"."enum__works_v_blocks_cta_links_link_appearance";
    DROP TYPE IF EXISTS "public"."enum__works_v_blocks_cta_links_link_type";
    DROP TYPE IF EXISTS "public"."enum__works_v_blocks_biography_alignment";
    DROP TYPE IF EXISTS "public"."enum_works_status";
    DROP TYPE IF EXISTS "public"."enum_works_blocks_archive_relation_to";
    DROP TYPE IF EXISTS "public"."enum_works_blocks_archive_populate_by";
    DROP TYPE IF EXISTS "public"."enum_works_blocks_content_columns_link_appearance";
    DROP TYPE IF EXISTS "public"."enum_works_blocks_content_columns_link_type";
    DROP TYPE IF EXISTS "public"."enum_works_blocks_content_columns_size";
    DROP TYPE IF EXISTS "public"."enum_works_blocks_cta_links_link_appearance";
    DROP TYPE IF EXISTS "public"."enum_works_blocks_cta_links_link_type";
    DROP TYPE IF EXISTS "public"."enum_works_blocks_biography_alignment";
  `)
}
