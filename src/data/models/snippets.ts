import { relations } from "drizzle-orm";
import { sqliteTable, int, text, real } from "drizzle-orm/sqlite-core";
import { chapters } from "./chapters";

export const snippets = sqliteTable("snippets", {
  id: int("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  content: text("content").notNull().default(""),
  sortOrder: real("sort_order").notNull(),
  createdAt: int("created_at").notNull(),
  modifiedAt: int("modified_at").notNull(),
  recordedAt: int("recorded_at").notNull().default(0),
  processedAt: int("processed_at").notNull().default(0),
  finishedAt: int("finished_at").notNull().default(0),
  rawRecordingContent: text("raw_recording_content").notNull().default(""),
  chapterId: int("chapter_id")
    .notNull()
    .references(() => chapters.id),
});

export const snippetsRelations = relations(snippets, ({ one }) => ({
  chapter: one(chapters, {
    fields: [snippets.chapterId],
    references: [chapters.id],
  }),
}));
