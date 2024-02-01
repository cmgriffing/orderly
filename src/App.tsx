import {
  AppShell,
  Group,
  Burger,
  Flex,
  Text,
  ActionIcon,
  Button,
  Menu,
  useMantineTheme,
  getThemeColor,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState, startTransition } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { clsx } from "clsx";
import pdf from "pdfjs";
import pdfFont from "pdfjs/font/Helvetica";

import { DBUtils } from "./data/db";

import {
  IconCaretRight,
  IconCaretDown,
  IconDots,
  IconPlus,
  IconTextSize,
  IconTrash,
  IconSettings,
  IconUpload,
  IconDownload,
} from "@tabler/icons-react";
import { NodeApi, Tree } from "react-arborist";
import { BookWithChapters, BooksCRUD } from "./data/repositories/books";
import { ChapterModel, ChaptersCRUD } from "./data/repositories/chapters";

import { CreateOrUpdateModal } from "./components/CreateOrUpdateModal";
import { SettingsModal } from "./components/SettingsModal";

import {
  appReady,
  currentBooks,
  currentChapter,
  currentModel,
  fetchTimestamp,
} from "./state/main";
import "./App.scss";
import { SnippetsQueries } from "./data/repositories/snippets";

export function App() {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const [selectedChapter] = useAtom(currentChapter);
  const [opened, { toggle }] = useDisclosure();
  const [
    createBookModalOpened,
    { open: openCreateBookModal, close: closeCreateBookModal },
  ] = useDisclosure(false);
  const [
    editBookModalOpened,
    { open: openEditBookModal, close: closeEditBookModal },
  ] = useDisclosure(false);

  const [
    createChapterModalOpened,
    { open: openCreateChapterModal, close: closeCreateChapterModal },
  ] = useDisclosure(false);

  const [
    settingsModalOpened,
    { open: openSettingsModal, close: closeSettingsModal },
  ] = useDisclosure(false);

  const [currentBook, setCurrentBook] = useState<BookWithChapters>();

  const [ready, setAppReady] = useAtom(appReady);
  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [books] = useAtom(currentBooks);
  const [whisperModel] = useAtom(currentModel);

  useEffect(() => {
    async function initialize() {
      await DBUtils.seed();
      startTransition(() => {
        setTimeout(() => {
          setAppReady(true);
          setFetchTimestamp(Date.now());
        }, 3000);
      });
    }

    initialize();
  }, [setAppReady, setFetchTimestamp]);

  useEffect(() => {
    if (!whisperModel && ready) {
      openSettingsModal();
    }
  }, [whisperModel, openSettingsModal, ready]);

  return (
    <>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShell.Header>
          <Flex justify={"space-between"} align="center" p={12}>
            <Group h="100%" px="md" wrap="nowrap">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Flex align="center" gap={8} wrap={"nowrap"}>
                <img src="/orderly.svg" alt="Orderly" width={32} />
                <Link to="/" color="inherit">
                  <Text
                    ff="Courier New"
                    fw={900}
                    size="xl"
                    c={getThemeColor("black", theme)}
                  >
                    Orderly
                  </Text>
                </Link>
                <Text c="red" size="xs" fw={700} ml={-6} mt={-6}>
                  <sup>ALPHA</sup>
                </Text>
              </Flex>
            </Group>
            <Group wrap="nowrap">
              <Button
                className="mobile-friendly-button-md"
                variant={"outline"}
                onClick={() => {
                  const inputElement = document.createElement("input");
                  inputElement.setAttribute("type", "file");

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  inputElement.onchange = async (e: any) => {
                    console.log("uploading file", { e });
                    // probably need to validate the file.
                    try {
                      if (e.target?.files?.[0]) {
                        await DBUtils.overwriteDatabaseFile(e.target.files[0]);
                        startTransition(() => {
                          setFetchTimestamp(Date.now());
                        });
                      }
                    } catch (e: unknown) {
                      console.log("Error uploading sqlite file", e);
                      alert(
                        "There was an error uploading the sqlite dump file. It may be corrupted or an invalid sqlite file."
                      );
                    }
                  };

                  inputElement.click();
                }}
              >
                <Text className="sr-only-md" mr="1rem">
                  Import
                </Text>
                <IconUpload />
              </Button>
              <Button
                className="mobile-friendly-button-md"
                variant={"outline"}
                onClick={async () => {
                  const dbFile = await DBUtils.getDatabaseFile();
                  const aElement = document.createElement("a");
                  aElement.setAttribute("download", "orderly.sqlite3");
                  const href = URL.createObjectURL(dbFile);
                  aElement.href = href;
                  aElement.setAttribute("target", "_blank");
                  aElement.click();
                  URL.revokeObjectURL(href);
                }}
              >
                <Text className="sr-only-md" mr="1rem">
                  Export
                </Text>
                <IconDownload />
              </Button>
              <Button
                className="mobile-friendly-button-md"
                onClick={() => {
                  openSettingsModal();
                }}
              >
                <Text className="sr-only-md" mr="1rem">
                  Settings
                </Text>
                <IconSettings />
              </Button>
            </Group>
          </Flex>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <Flex align="center" justify={"space-between"} mb={24}>
            <Text>Books</Text>
            <Group>
              <Button
                rightSection={<IconPlus stroke={3} />}
                onClick={() => {
                  openCreateBookModal();
                }}
              >
                Book
              </Button>
            </Group>
          </Flex>

          {!!books.length && (
            <Tree
              rowHeight={36}
              onMove={async (e) => {
                if (!e?.parentNode?.data.book?.chapters) {
                  return;
                }

                let newSortOrder = 0;
                if (e.index === 0) {
                  newSortOrder =
                    (e?.parentNode?.data.book?.chapters?.[e.index].sortOrder ||
                      0) - 1;
                } else if (
                  e.index >= e?.parentNode?.data.book?.chapters.length
                ) {
                  newSortOrder =
                    e?.parentNode?.data.book?.chapters?.[e.index - 1]
                      .sortOrder + 1;
                } else {
                  newSortOrder =
                    ((e?.parentNode?.data.book?.chapters?.[e.index - 1]
                      .sortOrder ||
                      e?.parentNode?.data.book?.chapters?.length - 1) +
                      (e?.parentNode?.data.book?.chapters?.[e.index]
                        .sortOrder ||
                        e?.parentNode?.data.book?.chapters?.length)) /
                    2;
                }

                const nodeData = e.dragNodes[0].data as unknown as {
                  chapter: ChapterModel;
                };

                // this is wrong. Updating every node would be easy enough. Might be better to manage a prev/next field
                await ChaptersCRUD.update(nodeData.chapter.id, {
                  sortOrder: newSortOrder,
                });

                // fetchBooks();
                setFetchTimestamp(Date.now());
              }}
              data={books.map((book) => ({
                book,
                id: `book${book.id}`,
                chapters: book.chapters.map((chapter: ChapterModel) => ({
                  chapter,
                  id: `chapter${chapter.id}`,
                })),
              }))}
              childrenAccessor={"chapters"}
            >
              {({ node, style, dragHandle }) => {
                const nodeData = node.data as unknown as {
                  chapter: ChapterModel;
                };

                const book = node.data.book;

                return !node.isLeaf ? (
                  <Flex direction={"column"}>
                    <Flex
                      style={style}
                      justify={"space-between"}
                      pr={32}
                      onClick={() => node.isInternal && node.toggle()}
                    >
                      <Flex>
                        <FolderArrow node={node} />
                        <Text className="single-line-ellipsis" maw="210px">
                          {node.data.book.title}
                        </Text>
                      </Flex>
                      <Menu shadow="md">
                        <Menu.Target>
                          <ActionIcon
                            variant="transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <IconDots />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconTextSize />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentBook(node.data.book);
                              openEditBookModal();
                            }}
                          >
                            Rename
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconPlus />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentBook(node.data.book);
                              openCreateChapterModal();
                            }}
                          >
                            Add Chapter
                          </Menu.Item>

                          <Menu.Item
                            leftSection={<IconDownload />}
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const doc = new pdf.Document({
                                  font: pdfFont,
                                  padding: 32,
                                });

                                // fetch chapters for book
                                const bookContent = await Promise.all(
                                  book.chapters.map(
                                    async (chapter: ChapterModel) => {
                                      // fetch snippets for chapter
                                      const snippets =
                                        await SnippetsQueries.getSnippetsForChapter(
                                          chapter.id
                                        );
                                      const content = snippets
                                        .filter((snippet) => !!snippet.content)
                                        .map((snippet) => {
                                          return `          ${snippet.content}`;
                                        })
                                        .join("\n");

                                      return {
                                        title: chapter.label,
                                        content,
                                      };
                                    }
                                  )
                                );

                                // Compose Title page and Chapters
                                doc.text(
                                  `${new Array(4)
                                    .fill("")
                                    .map(() => "\n")
                                    .join("")}${book.title}`,
                                  {
                                    textAlign: "center",
                                    fontSize: 42,
                                    lineHeight: 6,
                                  }
                                );

                                bookContent.forEach((chapter) => {
                                  doc.pageBreak();
                                  doc.text(`\n${chapter.title}\n\n`, {
                                    textAlign: "center",
                                    fontSize: 32,
                                    lineHeight: 2,
                                  });
                                  doc.text(chapter.content);
                                });

                                const bookContentBuffer = await doc.asBuffer();

                                // Convert to blob and trigger download
                                const aElement = document.createElement("a");
                                aElement.setAttribute(
                                  "download",
                                  book.title + ".pdf"
                                );
                                const href = URL.createObjectURL(
                                  new Blob([bookContentBuffer], {
                                    type: "application/pdf",
                                  })
                                );
                                aElement.href = href;
                                aElement.setAttribute("target", "_blank");
                                aElement.click();
                                URL.revokeObjectURL(href);
                              } catch (e: unknown) {
                                console.log("Error exporting to PDF: ", e);
                              }
                            }}
                          >
                            Export to PDF
                          </Menu.Item>

                          <Menu.Item
                            leftSection={<IconTrash />}
                            color="red"
                            onClick={async (e) => {
                              e.stopPropagation();
                              // TODO: Delete snippets, chapters, and book

                              await BooksCRUD.delete(node.data.book.id);

                              setFetchTimestamp(Date.now());
                            }}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Flex>
                    {!book.chapters.length && ready && (
                      <Flex px="2rem" justify="center" align="center">
                        Chapters not found. You can create one using the menu
                        above.
                      </Flex>
                    )}
                  </Flex>
                ) : (
                  <div ref={dragHandle} style={style}>
                    <Link
                      to={`/books/${nodeData.chapter.bookId}/chapters/${nodeData.chapter.id}`}
                      className={clsx("tree-link", {
                        selected: selectedChapter?.id === nodeData.chapter.id,
                      })}
                    >
                      <Text className="single-line-ellipsis">
                        {nodeData.chapter.label}
                      </Text>
                    </Link>
                  </div>
                );
              }}
            </Tree>
          )}
          {!books.length && ready && (
            <Flex>
              Books not found. You can create one using the button above.
            </Flex>
          )}
        </AppShell.Navbar>
        <AppShell.Main
          w={"100dvw"}
          h="100dvh"
          display={"flex"}
          pos={"relative"}
        >
          <Outlet />

          <CreateOrUpdateModal
            opened={createBookModalOpened}
            inputLabel="Book Title"
            modalTitle="Create Book"
            onClose={() => closeCreateBookModal()}
            onSubmit={async (newTitle) => {
              try {
                await BooksCRUD.create({
                  title: newTitle,
                });
                startTransition(() => {
                  setFetchTimestamp(Date.now());
                });
                closeCreateBookModal();
              } catch (e) {
                console.log("oof", e);
              }
            }}
          />

          <CreateOrUpdateModal
            opened={editBookModalOpened}
            inputLabel="Book Title"
            modalTitle="Edit Book"
            title={currentBook?.title || ""}
            buttonLabel="Update"
            onClose={() => closeEditBookModal()}
            onSubmit={async (newTitle) => {
              try {
                if (!currentBook) {
                  console.log("No Current Book", currentBook);
                  return;
                }
                await BooksCRUD.update(currentBook.id, {
                  title: newTitle,
                });

                startTransition(() => {
                  setFetchTimestamp(Date.now());
                });
                closeEditBookModal();
              } catch (e) {
                console.log("oof", e);
              }
            }}
          />

          <CreateOrUpdateModal
            opened={createChapterModalOpened}
            inputLabel="Chapter Title"
            modalTitle="Create Chapter"
            onClose={() => closeCreateChapterModal()}
            onSubmit={async (newTitle) => {
              try {
                if (!currentBook?.chapters) {
                  return;
                }

                const lastChapter =
                  currentBook?.chapters[currentBook?.chapters.length - 1];
                const sortOrder = lastChapter ? lastChapter.sortOrder + 1 : 0;

                const newChapter = await ChaptersCRUD.create({
                  label: newTitle,
                  sortOrder,
                  bookId: currentBook?.id,
                });

                setFetchTimestamp(Date.now());
                closeCreateChapterModal();
                navigate(
                  `/books/${currentBook?.id}/chapters/${newChapter?.id}`
                );
              } catch (e) {
                console.log("oof", e);
              }
            }}
          />

          <SettingsModal
            opened={settingsModalOpened}
            closeable={!!whisperModel}
            onSubmit={() => {
              closeSettingsModal();
            }}
            onClose={() => {
              closeSettingsModal();
            }}
          />
        </AppShell.Main>
      </AppShell>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FolderArrow({ node }: { node: NodeApi<any> }) {
  if (node.isLeaf) return <span></span>;
  return <span>{node.isOpen ? <IconCaretDown /> : <IconCaretRight />}</span>;
}
