import { atom } from "jotai";
import { BookWithChapters, BooksQueries } from "../data/repositories/books";
import { ChaptersCRUD } from "../data/repositories/chapters";
import { SnippetsCRUD, SnippetsQueries } from "../data/repositories/snippets";

export const fetchTimestamp = atom(0);

// Books

export const currentBooks = atom(async (get) => {
  get(fetchTimestamp);
  return BooksQueries.getBooksWithChapters();
});
export const currentBook = atom<BookWithChapters | undefined>(undefined);

// Chapters

export const currentChapterId = atom<number | undefined>(undefined);
export const currentChapter = atom((get) => {
  get(fetchTimestamp);
  const chapterId = get(currentChapterId);
  return ChaptersCRUD.read(chapterId || -1);
});
export const currentSnippets = atom((get) => {
  get(fetchTimestamp);
  const chapterId = get(currentChapterId);
  return SnippetsQueries.getSnippetsForChapter(chapterId || -1);
});

// Snippets

export const currentSnippetId = atom<number | undefined>(undefined);
export const currentSnippet = atom((get) => {
  get(fetchTimestamp);
  const snippetId = get(currentSnippetId);
  return SnippetsCRUD.read(snippetId || -1);
});
