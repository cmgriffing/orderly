import { sqliteTable, int, text } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: int("id").primaryKey({ autoIncrement: true }),
  userId: int("user_id").notNull(),
  threads: int("threads").default(2).notNull(),
  selectedModel: text("selected_model").default("").notNull(),
  createdAt: int("created_at").notNull(),
  modifiedAt: int("modified_at").notNull(),
});
