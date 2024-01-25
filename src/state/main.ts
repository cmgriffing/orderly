import { atom } from "jotai";
import { BookWithChapters, BooksQueries } from "../data/repositories/books";
import { ChaptersCRUD } from "../data/repositories/chapters";
import { SnippetsCRUD, SnippetsQueries } from "../data/repositories/snippets";
import { SettingsQueries } from "../data/repositories/settings";
import { loadOrGetModel } from "../utils/model-data";
import { WhisperModelName } from "../types";

export const appReady = atom(false);
export const fetchTimestamp = atom(0);

// Books

export const currentBooks = atom(async (get) => {
  get(fetchTimestamp);
  const ready = get(appReady);
  if (!ready) {
    return [];
  }

  return BooksQueries.getBooksWithChapters();
});
export const currentBook = atom<BookWithChapters | undefined>(undefined);

// Chapters

export const currentChapterId = atom<number | undefined>(undefined);
export const currentChapter = atom((get) => {
  get(fetchTimestamp);
  const ready = get(appReady);
  if (!ready) {
    return;
  }

  const chapterId = get(currentChapterId);
  if (chapterId === 0 || chapterId) {
    return ChaptersCRUD.read(chapterId || -1);
  }
});
export const currentSnippets = atom((get) => {
  get(fetchTimestamp);
  const ready = get(appReady);
  if (!ready) {
    return [];
  }

  const chapterId = get(currentChapterId);
  if (chapterId === 0 || chapterId) {
    return SnippetsQueries.getSnippetsForChapter(chapterId);
  }
});

// Snippets

export const currentSnippetId = atom<number | undefined>(undefined);
export const currentSnippet = atom((get) => {
  get(fetchTimestamp);
  const ready = get(appReady);
  if (!ready) {
    return;
  }

  const snippetId = get(currentSnippetId);
  if (snippetId === 0 || snippetId) {
    return SnippetsCRUD.read(snippetId);
  }
});

// Settings

export const currentSettings = atom(async (get) => {
  get(fetchTimestamp);
  const ready = get(appReady);
  if (!ready) {
    return;
  }

  return SettingsQueries.getSettingsForUser();
});

// Whisper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Module: any;
export const currentModel = atom(
  async (get) => {
    const settings = await get(currentSettings);
    if (!settings) {
      return;
    }

    return loadOrGetModel(settings.selectedModel as WhisperModelName, () => {});
  },
  (_get, _set, update) => {
    return update;
  }
);
export const whisperInstance = atom(async (get) => {
  const model = await get(currentModel);
  const settings = await get(currentSettings);
  if (!settings) {
    return;
  }

  if (model) {
    try {
      Module.FS_unlink("whisper.bin");
    } catch (e) {
      // ignore
    }

    Module.FS_createDataFile("/", "whisper.bin", model, true, true);

    return {
      processAudio: (audio: Float32Array | ArrayBuffer) => {
        const instance = Module.init("whisper.bin");
        Module.print = (msg: string) => {
          console.log("overridden", msg);
        };

        return Module.full_default(
          instance,
          audio,
          "en", // selectedLanguage
          settings.threads, // nthreads,
          false // translate
        );
      },
    };
  } else {
    console.log("No Model loaded");
  }
});
