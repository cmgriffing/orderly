import { InferSelectModel, InferInsertModel, eq } from "drizzle-orm";
import { chapters } from "../models/chapters";
import { createRepository } from "../utils";
import { db } from "../db";
import { SnippetModel } from "./snippets";
import { snippets } from "../models/snippets";

export type ChapterModel = InferSelectModel<typeof chapters>;
export type ChapterInsertModel = InferInsertModel<typeof chapters>;

export type ChapterWithSnippetsModel = ChapterModel & {
  snippets: SnippetModel[];
};

export const ChaptersCRUD = createRepository<ChapterModel, ChapterInsertModel>(
  chapters
);

export class ChaptersQueries {
  static getChapter(chapterId: number, withSnippets?: true) {
    return db.query.chapters.findFirst({
      where: eq(chapters.id, chapterId),
      orderBy: chapters.sortOrder,
      with: {
        snippets: withSnippets,
      },
    });
  }

  static deleteChapter(chapterId: number) {
    return db.transaction(async (tx) => {
      await tx.delete(snippets).where(eq(snippets.chapterId, chapterId));
      await tx.delete(chapters).where(eq(chapters.id, chapterId));
    });
  }
}
