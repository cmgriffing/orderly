import { startTransition, useEffect } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  ActionIcon,
  Flex,
  Menu,
  Text,
  ScrollArea,
  Button,
  Title,
  CloseButton,
} from "@mantine/core";
import { useMediaQuery, useViewportSize } from "@mantine/hooks";
import { Tree } from "react-arborist";
import { useAtom } from "jotai";
import { useDisclosure } from "@mantine/hooks";
import { clsx } from "clsx";

import {
  IconDots,
  IconTextSize,
  IconPlus,
  IconTrash,
  IconCaretDownFilled,
} from "@tabler/icons-react";

import {
  appReady,
  currentBook,
  currentBookId,
  currentChapter,
  currentChapterId,
  currentSnippet,
  currentSnippetId,
  currentSnippets,
  fetchTimestamp,
} from "../state/main";

import { ChaptersCRUD } from "../data/repositories/chapters";
import { SnippetsCRUD } from "../data/repositories/snippets";
import { CreateOrUpdateModal } from "../components/CreateOrUpdateModal";
import { SnippetStatusIcon } from "../components/SnippetStatusIcon";
import { NotFoundPageWrapper } from "../components/NotFoundPageWrapper";

import "./Chapter.scss";

export function Chapter() {
  const navigate = useNavigate();
  const {
    bookId: rawBookId,
    chapterId: rawChapterId,
    snippetId: rawSnippetId,
  } = useParams();
  const bookId = parseInt(rawBookId || "-1");
  const chapterId = parseInt(rawChapterId || "-1");
  const snippetId = parseInt(rawSnippetId || "-1");

  const { height: innerHeight } = useViewportSize();
  const shouldHideTreeColumn = useMediaQuery(`(max-width: 1024px)`);

  const [ready] = useAtom(appReady);
  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [, setCurrentBookId] = useAtom(currentBookId);
  const [, setCurrentChapterId] = useAtom(currentChapterId);
  const [, setCurrentSnippetId] = useAtom(currentSnippetId);
  const [book] = useAtom(currentBook);
  const [chapter] = useAtom(currentChapter);
  const [snippets] = useAtom(currentSnippets);
  const [selectedSnippet] = useAtom(currentSnippet);

  const [
    editChapterModalOpened,
    { open: openEditChapterModal, close: closeEditChapterModal },
  ] = useDisclosure(false);

  const [
    snippetsMenuOpened,
    { open: openSnippetsMenu, close: closeSnippetsMenu },
  ] = useDisclosure(false);

  useEffect(() => {
    setCurrentBookId(bookId);
  }, [bookId, setCurrentBookId]);

  useEffect(() => {
    setCurrentChapterId(chapterId);
  }, [chapterId, setCurrentChapterId]);

  useEffect(() => {
    setCurrentSnippetId(snippetId);
  }, [snippetId, setCurrentSnippetId]);

  async function createNewSnippet(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    e.stopPropagation();
    // create new snippet with default name

    const newSnippet = await SnippetsCRUD.create({
      label: "New Snippet",
      sortOrder: snippets?.length || 0,
      chapterId,
    });

    if (newSnippet) {
      startTransition(() => {
        setFetchTimestamp(Date.now());
      });
      navigate(
        `/books/${bookId}/chapters/${chapterId}/snippets/${newSnippet?.id}`
      );
    }
  }

  const chapterMenu = (
    <Menu shadow="md">
      <Menu.Target>
        <ActionIcon
          variant="transparent"
          size="xl"
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
          onClick={() => {
            openEditChapterModal();
          }}
        >
          Rename
        </Menu.Item>
        <Menu.Item leftSection={<IconPlus />} onClick={createNewSnippet}>
          Add Snippet
        </Menu.Item>
        <Menu.Item
          leftSection={<IconTrash />}
          c="red"
          onClick={async (e) => {
            e.stopPropagation();
            await ChaptersCRUD.delete(chapterId);
            startTransition(() => {
              setFetchTimestamp(Date.now());
            });
            navigate("/");
          }}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  return (
    <>
      <NotFoundPageWrapper
        hasEntity={!!book}
        entityName="Book"
        notFoundContent={
          <>
            <Text w="300px">
              The book could not be found. You can create a new one using the
              button in the sidebar.
            </Text>
          </>
        }
      >
        <NotFoundPageWrapper
          hasEntity={!!chapter}
          entityName="Chapter"
          notFoundContent={
            <>
              <Text w="300px">
                The chapter could not be found. You can create a new one using
                the book's menu in the sidebar.
              </Text>
            </>
          }
        >
          <Flex
            h="100%"
            w="100%"
            direction={shouldHideTreeColumn ? "column" : "row"}
            pos={"relative"}
          >
            <div
              className={clsx("chapter-snippets-menu-content", {
                open: snippetsMenuOpened,
              })}
            >
              <Flex
                justify={"space-between"}
                align={"center"}
                mx={"-10px"}
                mt={"-10px"}
                bg={"white"}
              >
                <Flex align="center" maw={"80dvw"}>
                  {/* <ActionIcon variant="subtle" onClick={openEditChapterModal}>
                    <IconEdit />
                  </ActionIcon> */}
                  {chapterMenu}
                  <Title className="single-line-ellipsis" size={"1.5rem"}>
                    {chapter?.label}
                  </Title>
                </Flex>
                <CloseButton
                  size={"xl"}
                  onClick={() => {
                    closeSnippetsMenu();
                  }}
                />
              </Flex>
              <ScrollArea mah={"100%"} w="100%">
                {snippets?.map((snippet) => (
                  <Link
                    to={`/books/${bookId}/chapters/${snippet.chapterId}/snippets/${snippet?.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeSnippetsMenu();
                    }}
                    className={clsx("menu-link", {
                      selected: selectedSnippet?.id === snippet.id,
                    })}
                  >
                    <Flex align="center">
                      <SnippetStatusIcon snippet={snippet} height={24} />
                      <Text
                        className="single-line-ellipsis"
                        maw="72dvw"
                        ml="0.5rem"
                      >
                        {snippet.label}
                      </Text>
                    </Flex>
                  </Link>
                ))}
              </ScrollArea>
              <Button onClick={createNewSnippet}>Create New Snippet</Button>
            </div>
            <Flex
              className="snippets-tree"
              h="100%"
              w="20rem"
              direction={"column"}
            >
              <Flex justify={"space-between"} align={"center"} mt={"-5px"}>
                <Text className="single-line-ellipsis" maw="260px">
                  {chapter?.label}
                </Text>
                {chapterMenu}
              </Flex>

              {!!snippets?.length && snippets?.length > 0 && (
                <Tree
                  height={innerHeight - 120}
                  rowHeight={36}
                  onMove={async (e) => {
                    let newSortOrder = 0;
                    if (e.index === 0) {
                      newSortOrder = (snippets[e.index].sortOrder || 0) - 1;
                    } else if (e.index >= snippets.length) {
                      newSortOrder = snippets[e.index - 1].sortOrder + 1;
                    } else {
                      newSortOrder =
                        ((snippets[e.index - 1].sortOrder ||
                          snippets.length - 1) +
                          (snippets[e.index].sortOrder || snippets.length)) /
                        2;
                    }
                    await SnippetsCRUD.update(e.dragNodes[0].data.id, {
                      sortOrder: newSortOrder,
                    });

                    setFetchTimestamp(Date.now());
                  }}
                  data={snippets}
                >
                  {({ node, dragHandle, style }) => (
                    <div ref={dragHandle} style={{ ...style, padding: "4px" }}>
                      <Link
                        to={`/books/${bookId}/chapters/${node.data.chapterId}/snippets/${node.data?.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className={clsx("tree-link", {
                          selected: selectedSnippet?.id === node?.data.id,
                        })}
                      >
                        <Flex align="center">
                          <SnippetStatusIcon snippet={node.data} height={24} />
                          <Text
                            className="single-line-ellipsis"
                            maw="210px"
                            ml="0.5rem"
                          >
                            {node.data.label}
                          </Text>
                        </Flex>
                      </Link>
                    </div>
                  )}
                </Tree>
              )}

              {!snippets?.length && ready && (
                <Flex px="1rem" justify="center" align="center">
                  Snippets not found. You can create one using the menu above.
                </Flex>
              )}
            </Flex>

            <Button
              variant="outline"
              className="snippets-menu-button"
              mb="1rem"
              onClick={() => {
                if (!snippetsMenuOpened) {
                  openSnippetsMenu();
                } else {
                  closeSnippetsMenu();
                }
              }}
            >
              <Flex align="center">
                Snippets Menu <IconCaretDownFilled size={"1rem"} />
              </Flex>
            </Button>

            <ScrollArea.Autosize mah={"90vh"} w={"100%"} mx="auto">
              <Outlet />
            </ScrollArea.Autosize>

            <CreateOrUpdateModal
              opened={editChapterModalOpened}
              inputLabel="Chapter Title"
              modalTitle="Edit Chapter"
              buttonLabel="Update"
              title={chapter?.label}
              onClose={() => closeEditChapterModal()}
              onSubmit={async (newTitle) => {
                try {
                  await ChaptersCRUD.update(chapterId, {
                    label: newTitle,
                  });

                  setFetchTimestamp(Date.now());
                  closeEditChapterModal();
                } catch (e) {
                  console.log("oof", e);
                }
              }}
            />
          </Flex>
        </NotFoundPageWrapper>
      </NotFoundPageWrapper>
    </>
  );
}
