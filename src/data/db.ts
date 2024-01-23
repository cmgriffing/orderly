import { SQLocalDrizzle } from "sqlocal/drizzle";
import { SQLocalKysely } from "sqlocal/kysely";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { Migrator, Kysely } from "kysely";

import * as bookSchema from "./models/books";
import * as chapterSchema from "./models/chapters";
import * as snippetSchema from "./models/snippets";

import { RuntimeMigrationProvider } from "./migrations/provider";

const { driver, sql, getDatabaseFile, overwriteDatabaseFile } =
  new SQLocalDrizzle("database.sqlite3");

export const db = drizzle(driver, {
  schema: {
    ...bookSchema,
    ...chapterSchema,
    ...snippetSchema,
  },
});

const { dialect } = new SQLocalKysely("database.sqlite3");
const kyselyDb = new Kysely({
  dialect,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

const migrator = new Migrator({
  db: kyselyDb,
  provider: new RuntimeMigrationProvider(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).resetDB = async function () {
  await sql`DROP TABLE IF EXISTS books`;
  await sql`DROP TABLE IF EXISTS chapters`;
  await sql`DROP TABLE IF EXISTS snippets`;
  await sql`DROP TABLE IF EXISTS settings`;
};

// IIFE to make sure that the schema is created before the app starts
(async () => {
  await sql`PRAGMA foreign_keys = ON;`;

  await sql`INSERT OR IGNORE INTO settings(id,user_id,threads,selected_model,created_at,modified_at)
VALUES (0,1,2,'',0,0)`;

  await migrator.migrateToLatest();

  // get available books
  // if empty, run seed process

  // seed book

  // seed chapters for book

  // seed snippets for chapters
})();

export const DBUtils = {
  getDatabaseFile,
  overwriteDatabaseFile,
  sql,
};
