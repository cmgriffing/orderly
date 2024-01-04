import { InferSelectModel, InferInsertModel, eq } from "drizzle-orm";
import { snippets } from "../models/snippets";
import { createRepository } from "../utils";
import { db } from "../db";

export type SnippetModel = InferSelectModel<typeof snippets>;
export type SnippetInsertModel = InferInsertModel<typeof snippets>;

export const SnippetsCRUD = createRepository<SnippetModel, SnippetInsertModel>(
  snippets
);

export class SnippetsQueries {
  static getSnippetsForChapter(chapterId: number) {
    return db
      .select()
      .from(snippets)
      .where(eq(snippets.chapterId, chapterId))
      .orderBy(snippets.sortOrder)
      .then((results) => results || []);
  }
}
