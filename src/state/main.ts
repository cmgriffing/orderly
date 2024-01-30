import { atom } from "jotai";
import { BooksCRUD, BooksQueries } from "../data/repositories/books";
import { ChaptersCRUD } from "../data/repositories/chapters";
import { SnippetsCRUD, SnippetsQueries } from "../data/repositories/snippets";
import {
  SettingsCRUD,
  SettingsModel,
  SettingsQueries,
} from "../data/repositories/settings";
import { loadOrGetModel } from "../utils/model-data";
import { WhisperModelName } from "../types";

export const appReady = atom(false);
export const fetchTimestamp = atom(0);
export const settingsFetchTimestamp = atom(0);

// Books

export const currentBooks = atom(async (get) => {
  get(fetchTimestamp);
  const ready = get(appReady);
  if (!ready) {
    return [];
  }

  return BooksQueries.getBooksWithChapters();
});

export const currentBookId = atom<number | undefined>(undefined);
export const currentBook = atom(async (get) => {
  get(fetchTimestamp);
  const bookId = get(currentBookId);
  const ready = get(appReady);
  if (!ready) {
    return;
  }

  if (bookId === 0 || bookId) {
    return BooksCRUD.read(bookId);
  }
});

// Chapters

export const currentChapterId = atom<number | undefined>(undefined);
export const currentChapter = atom(async (get) => {
  get(fetchTimestamp);
  const chapterId = get(currentChapterId);
  const ready = get(appReady);
  if (!ready) {
    return;
  }

  if (chapterId === 0 || chapterId) {
    return ChaptersCRUD.read(chapterId);
  }
});
export const currentSnippets = atom(async (get) => {
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
export const currentSnippet = atom(async (get) => {
  get(fetchTimestamp);
  const snippetId = get(currentSnippetId);
  const ready = get(appReady);
  if (!ready) {
    return;
  }

  if (snippetId === 0 || snippetId) {
    return SnippetsCRUD.read(snippetId);
  }
});

// Settings

export const currentSettings = atom(
  async (get) => {
    get(settingsFetchTimestamp);
    const ready = get(appReady);
    if (!ready) {
      return;
    }

    return SettingsQueries.getSettingsForUser();
  },
  async (_get, _set, update: Partial<SettingsModel>) => {
    const settings: SettingsModel = await _get(currentSettings);

    if (!settings) {
      return update;
    }

    await SettingsCRUD.update(settings.id, update);
    _set(settingsFetchTimestamp, Date.now());
    return { ...settings, ...update };
  }
);

// Whisper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Module: any;
export const currentModel = atom(
  async (get) => {
    const settings = await get(currentSettings);
    const ready = get(appReady);
    if (!ready) {
      return;
    }

    if (!settings) {
      return;
    }

    // TODO: this method seems to leak memory when changing models
    return loadOrGetModel(settings.selectedModel as WhisperModelName, () => {});
  },
  async (_get, _set, update) => {
    return update;
  }
);
export const whisperInstance = atom(async (get) => {
  get(settingsFetchTimestamp);
  const model = await get(currentModel);
  const settings = await get(currentSettings);
  if (!settings || !model) {
    return;
  }

  if (model) {
    try {
      Module.FS_unlink("whisper.bin");
      // Module.free();
    } catch (e) {
      // ignore
    }

    Module.FS_createDataFile("/", "whisper.bin", model, true, true);
    const instance = Module.init("whisper.bin");

    return {
      processAudio: (audio: Float32Array | ArrayBuffer) => {
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
