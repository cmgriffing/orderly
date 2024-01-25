import { SQLocalDrizzle } from "sqlocal/drizzle";
import { SQLocalKysely } from "sqlocal/kysely";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { Migrator, Kysely } from "kysely";

import * as bookSchema from "./models/books";
import * as chapterSchema from "./models/chapters";
import * as snippetSchema from "./models/snippets";

import { RuntimeMigrationProvider } from "./migrations/provider";

const dbFileName = "database.sqlite3";

const { driver, sql, getDatabaseFile, overwriteDatabaseFile } =
  new SQLocalDrizzle(dbFileName);

export const db = drizzle(driver, {
  schema: {
    ...bookSchema,
    ...chapterSchema,
    ...snippetSchema,
  },
});

const { dialect } = new SQLocalKysely(dbFileName);
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
  // await sql`DROP TABLE IF EXISTS books`;
  // await sql`DROP TABLE IF EXISTS chapters`;
  // await sql`DROP TABLE IF EXISTS snippets`;
  // await sql`DROP TABLE IF EXISTS settings`;
  await migrator.migrateDown();
  await kyselyDb.destroy();
  (await navigator.storage.getDirectory()).removeEntry(dbFileName);
};

async function seed() {
  await sql`PRAGMA foreign_keys = ON;`;
  await migrator.migrateToLatest();
}

export const DBUtils = {
  getDatabaseFile,
  overwriteDatabaseFile,
  sql,
  seed,
};
