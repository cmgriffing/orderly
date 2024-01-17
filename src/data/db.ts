import { SQLocalDrizzle } from "sqlocal/drizzle";
import { drizzle } from "drizzle-orm/sqlite-proxy";

import * as bookSchema from "./models/books";
import * as chapterSchema from "./models/chapters";
import * as snippetSchema from "./models/snippets";
import { USER_ID } from "../constants";

const { driver, sql } = new SQLocalDrizzle("database.sqlite3");
export const db = drizzle(driver, {
  schema: {
    ...bookSchema,
    ...chapterSchema,
    ...snippetSchema,
  },
});

(window as any).resetDB = async function () {
  await sql`DROP TABLE IF EXISTS books`;
  await sql`DROP TABLE IF EXISTS chapters`;
  await sql`DROP TABLE IF EXISTS snippets`;
  await sql`DROP TABLE IF EXISTS settings`;
};

await sql`PRAGMA foreign_keys = ON;`;

await sql`CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  modified_at INTEGER NOT NULL
)`;

await sql`CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  sort_order REAL NOT NULL,
  created_at INTEGER NOT NULL,
  modified_at INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
)`;

await sql`CREATE TABLE IF NOT EXISTS snippets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT "",
  sort_order REAL NOT NULL,
  created_at INTEGER NOT NULL,
  modified_at INTEGER NOT NULL,
  recorded_at INTEGER NOT NULL DEFAULT 0,
  processed_at INTEGER NOT NULL DEFAULT 0,
  finished_at INTEGER NOT NULL DEFAULT 0,
  raw_recording_content TEXT NOT NULL DEFAULT "",
  chapter_id INTEGER NOT NULL,
  FOREIGN KEY(chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
)`;

await sql`CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  threads INTEGER NOT NULL DEFAULT 2,
  selected_model TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  modified_at INTEGER NOT NULL
)`;

await sql`INSERT OR IGNORE INTO settings(id,user_id,threads,selected_model,created_at,modified_at)
VALUES (0,1,2,'',0,0)`;
