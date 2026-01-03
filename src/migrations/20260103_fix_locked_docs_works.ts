import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add works_id column to payload_locked_documents_rels table if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payload_locked_documents_rels'
        AND column_name = 'works_id'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "works_id" integer;
      END IF;
    END $$;

    -- Add foreign key constraint if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_works_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_works_fk"
        FOREIGN KEY ("works_id") REFERENCES "public"."works"("id")
        ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    -- Create index if it doesn't exist
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_works_id_idx"
    ON "payload_locked_documents_rels" USING btree ("works_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_works_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_works_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "works_id";
  `)
}
