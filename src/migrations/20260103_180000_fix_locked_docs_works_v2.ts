import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add works_id column to payload_locked_documents_rels table
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "works_id" integer;
  `)

  // Add foreign key constraint (check if it exists first to avoid error)
  const constraintCheck = await db.execute(sql`
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payload_locked_documents_rels_works_fk'
    AND table_name = 'payload_locked_documents_rels'
  `)

  if (constraintCheck.rows.length === 0) {
    await db.execute(sql`
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_works_fk"
      FOREIGN KEY ("works_id") REFERENCES "public"."works"("id")
      ON DELETE cascade ON UPDATE no action;
    `)
  }

  // Create index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_works_id_idx"
    ON "payload_locked_documents_rels" USING btree ("works_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_works_id_idx";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_works_fk";
  `)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "works_id";
  `)
}
