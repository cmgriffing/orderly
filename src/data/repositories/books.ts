import { books } from "./../models/books";
import { InferSelectModel, InferInsertModel, eq } from "drizzle-orm";
import { createRepository } from "../utils";
import { db } from "../db";
import { ChapterModel } from "./chapters";
import { chapters } from "../models/chapters";
import { snippets } from "../models/snippets";

export type BookModel = InferSelectModel<typeof books>;
export type BookInsertModel = InferInsertModel<typeof books>;

export const BooksCRUD = createRepository<BookModel, BookInsertModel>(books);

export type BookWithChapters = BookModel & { chapters: ChapterModel[] };

export class BooksQueries {
  static getBooksWithChapters(): Promise<BookWithChapters[]> {
    return db
      .select()
      .from(books)
      .leftJoin(chapters, eq(books.id, chapters.bookId))
      .then((results) => {
        const booksMap: Record<number, BookWithChapters> = {};

        results.forEach(({ books, chapters }) => {
          if (!booksMap[books.id]) {
            booksMap[books.id] = {
              ...books,
              chapters: [],
            };
          }

          if (chapters) {
            booksMap[books.id].chapters.push(chapters);
          }
        });

        const books = Object.values(booksMap);

        return books.map((book) => {
          book.chapters.sort((a, b) => a.sortOrder - b.sortOrder);
          return book;
        });

        // values.sort((a, b) => a.sortOrder - b.sortOrder);
      }) as Promise<BookWithChapters[]>;
  }

  static deleteBook(bookId: number) {
    return db.transaction(async (tx) => {
      const chaptersToDelete = await tx
        .select()
        .from(chapters)
        .where(eq(chapters.bookId, bookId));

      for (let i = 0; i < chaptersToDelete.length; i++) {
        await tx
          .delete(snippets)
          .where(eq(snippets.chapterId, chaptersToDelete[i].id));
      }

      await tx.delete(chapters).where(eq(chapters.bookId, bookId));
      await tx.delete(books).where(eq(books.id, bookId));
    });
  }

  // This SHOULD work but doesn't.
  // static getBooks(withChapters?: true) {
  //   return db.query.books.findMany({
  //     with: {
  //       chapters: withChapters,
  //     },
  //   });
  // }
}
