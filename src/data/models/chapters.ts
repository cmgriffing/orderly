import { relations } from "drizzle-orm";
import { sqliteTable, int, text, real } from "drizzle-orm/sqlite-core";
import { books } from "./books";
import { snippets } from "./snippets";

export const chapters = sqliteTable("chapters", {
  id: int("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  sortOrder: real("sort_order").notNull(),
  createdAt: int("created_at").notNull(),
  modifiedAt: int("modified_at").notNull(),
  bookId: int("book_id").references(() => books.id),
});

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  book: one(books, { fields: [chapters.bookId], references: [books.id] }),
  snippets: many(snippets),
}));
