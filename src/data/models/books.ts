import { relations } from "drizzle-orm";
import { sqliteTable, int, text } from "drizzle-orm/sqlite-core";
import { chapters } from "./chapters";

export const books = sqliteTable("books", {
  id: int("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  createdAt: int("created_at").notNull(),
  modifiedAt: int("modified_at").notNull(),
});

export const booksRelations = relations(books, ({ many }) => ({
  chapters: many(chapters),
}));
