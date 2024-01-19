import {
  AppShell,
  Group,
  Burger,
  Flex,
  Text,
  ActionIcon,
  Button,
  Menu,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { BookWithChapters, BooksCRUD } from "./data/repositories/books";
import {
  IconCaretRight,
  IconCaretDown,
  IconDots,
  IconPlus,
  IconTextSize,
  IconTrash,
  IconSettings,
} from "@tabler/icons-react";
import { NodeApi, Tree } from "react-arborist";
import { ChapterModel, ChaptersCRUD } from "./data/repositories/chapters";
import { CreateOrUpdateModal } from "./components/CreateOrUpdateModal";
import { SettingsModal } from "./components/SettingsModal";
import { currentBooks, currentModel, fetchTimestamp } from "./state/main";
import { useAtom } from "jotai";

export function App() {
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

  const [books] = useAtom(currentBooks);
  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [whisperModel] = useAtom(currentModel);

  useEffect(() => {
    if (!whisperModel) {
      openSettingsModal();
    }
  }, [whisperModel, openSettingsModal]);

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
            <Group h="100%" px="md">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Flex>
                <Text>Orderly</Text>
                <Text c="red" ml={4}>
                  ALPHA
                </Text>
              </Flex>
            </Group>
            <Group>
              <Button
                onClick={() => {
                  openSettingsModal();
                }}
              >
                Settings
                <Box ml={4}>
                  <IconSettings />
                </Box>
              </Button>
            </Group>
          </Flex>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <Flex align="center" justify={"space-between"} mb={24}>
            <Text>Books</Text>
            <Group>
              <Button
                onClick={() => {
                  openCreateBookModal();
                }}
              >
                Book
                <IconPlus stroke={3} />
              </Button>
            </Group>
          </Flex>
          <Tree
            onMove={async (e) => {
              if (!e?.parentNode?.data.book?.chapters) {
                return;
              }

              let newSortOrder = 0;
              if (e.index === 0) {
                newSortOrder =
                  (e?.parentNode?.data.book?.chapters?.[e.index].sortOrder ||
                    0) - 1;
              } else if (e.index >= e?.parentNode?.data.book?.chapters.length) {
                newSortOrder =
                  e?.parentNode?.data.book?.chapters?.[e.index - 1].sortOrder +
                  1;
              } else {
                newSortOrder =
                  ((e?.parentNode?.data.book?.chapters?.[e.index - 1]
                    .sortOrder ||
                    e?.parentNode?.data.book?.chapters?.length - 1) +
                    (e?.parentNode?.data.book?.chapters?.[e.index].sortOrder ||
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
              chapters: book.chapters.map((chapter) => ({
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

              return !node.isLeaf ? (
                <Flex
                  style={style}
                  justify={"space-between"}
                  pr={32}
                  onClick={() => node.isInternal && node.toggle()}
                >
                  <Flex>
                    <FolderArrow node={node} />
                    {node.data.book.title}
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
                          console.log("hmm", node.data.book);
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
                        leftSection={<IconTrash />}
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
              ) : (
                <div ref={dragHandle}>
                  <Link
                    to={`/books/${nodeData.chapter.bookId}/chapters/${nodeData.chapter.id}`}
                    style={style}
                  >
                    {nodeData.chapter.label}
                  </Link>
                </div>
              );
            }}
          </Tree>
        </AppShell.Navbar>
        <AppShell.Main w={"100dvw"} display={"flex"}>
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

                setFetchTimestamp(Date.now());
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

                setFetchTimestamp(Date.now());
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

                await ChaptersCRUD.create({
                  label: newTitle,
                  sortOrder,
                  bookId: currentBook?.id,
                });

                setFetchTimestamp(Date.now());
                closeCreateChapterModal();
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
