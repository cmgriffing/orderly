import { useEffect } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Flex, Menu, Text, ScrollArea } from "@mantine/core";
import { Tree } from "react-arborist";
import { useAtom } from "jotai";
import { useDisclosure } from "@mantine/hooks";
import { clsx } from "clsx";

import {
  IconDots,
  IconTextSize,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import {
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

export function Chapter() {
  const navigate = useNavigate();
  const { bookId, chapterId: rawChapterId, snippetId } = useParams();
  const chapterId = parseInt(rawChapterId || "-1");

  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [, setCurrentChapterId] = useAtom(currentChapterId);
  const [, setCurrentSnippetId] = useAtom(currentSnippetId);
  const [chapter] = useAtom(currentChapter);
  const [snippets] = useAtom(currentSnippets);
  const [selectedSnippet] = useAtom(currentSnippet);

  useEffect(() => {
    setCurrentSnippetId(snippetId ? parseInt(snippetId) : undefined);
  }, [snippetId, setCurrentSnippetId]);

  const [
    editChapterModalOpened,
    { open: openEditChapterModal, close: closeEditChapterModal },
  ] = useDisclosure(false);

  useEffect(() => {
    setCurrentChapterId(chapterId);
  }, [chapterId, setCurrentChapterId]);

  return (
    <Flex h="100%" w="100%">
      <Flex h="100%" w="14rem" direction={"column"}>
        <Flex justify={"space-between"}>
          <Text>{chapter?.label || "Chapter Not Found"}</Text>

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
                onClick={() => {
                  openEditChapterModal();
                }}
              >
                Rename
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPlus />}
                onClick={async (e) => {
                  e.stopPropagation();
                  // create new snippet with default name

                  const newSnippet = await SnippetsCRUD.create({
                    label: "New Snippet",
                    sortOrder: snippets?.length || 0,
                    chapterId,
                  });

                  if (newSnippet) {
                    setFetchTimestamp(Date.now());
                    navigate(
                      `/books/${bookId}/chapters/${chapterId}/snippets/${newSnippet?.id}`
                    );
                  }
                }}
              >
                Add Snippet
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash />}
                onClick={async (e) => {
                  e.stopPropagation();
                  await ChaptersCRUD.delete(chapterId);
                  setFetchTimestamp(Date.now());
                  navigate("/");
                }}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Flex>

        {snippets.length > 0 && (
          <Tree
            rowHeight={36}
            onMove={async (e) => {
              let newSortOrder = 0;
              if (e.index === 0) {
                newSortOrder = (snippets[e.index].sortOrder || 0) - 1;
              } else if (e.index >= snippets.length) {
                newSortOrder = snippets[e.index - 1].sortOrder + 1;
              } else {
                newSortOrder =
                  ((snippets[e.index - 1].sortOrder || snippets.length - 1) +
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
                    <Text>{node.data.label}</Text>
                  </Flex>
                </Link>
              </div>
            )}
          </Tree>
        )}
        {(!snippets || snippets?.length === 0) && <div>No Snippets found</div>}
      </Flex>

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
  );
}
