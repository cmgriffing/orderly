#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const name = process.argv[2];
const date = new Date().toISOString();

const template = `
import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  // await db.schema
  //   .createTable('person')
  //   .addColumn('id', 'integer', (col) => col.primaryKey())
  //   .addColumn('first_name', 'text', (col) => col.notNull())
  //   .addColumn('last_name', 'text')
  //   .addColumn('gender', 'text', (col) => col.notNull())
  //   .addColumn('created_at', 'text', (col) =>
  //     col.defaultTo(sql\`CURRENT_TIMESTAMP\`).notNull()
  //   )
  //   .execute()

  // await db.schema
  //   .createTable('pet')
  //   .addColumn('id', 'integer', (col) => col.primaryKey())
  //   .addColumn('name', 'text', (col) => col.notNull().unique())
  //   .addColumn('owner_id', 'integer', (col) =>
  //     col.references('person.id').onDelete('cascade').notNull()
  //   )
  //   .addColumn('species', 'text', (col) => col.notNull())
  //   .execute()

  // await db.schema
  //   .createIndex('pet_owner_id_index')
  //   .on('pet')
  //   .column('owner_id')
  //   .execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  // await db.schema.dropTable('pet').execute()
  // await db.schema.dropTable('person').execute()
}
`;

fs.writeFileSync(
  path.resolve(__dirname, "../src/data/migrations", `${date}-${name}.ts`),
  template
);

fs.appendFileSync(
  path.resolve(__dirname, "../src/data/migrations/index.ts"),
  `\nexport * as migration${date
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "")} from "./${date}-${name}.ts"`
);
