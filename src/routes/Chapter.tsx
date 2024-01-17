import { useEffect } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { ActionIcon, Box, Flex, Menu, Text } from "@mantine/core";
import { Tree } from "react-arborist";
import { useAtom } from "jotai";

import { SnippetsCRUD, SnippetModel } from "../data/repositories/snippets";
import {
  IconDots,
  IconTextSize,
  IconPlus,
  IconTrash,
  IconCircle,
  IconCircleDashed,
  IconCircleCheck,
  IconCircleFilled,
  IconHelpCircle,
} from "@tabler/icons-react";
import {
  currentChapter,
  currentChapterId,
  currentSnippets,
  fetchTimestamp,
} from "../state/main";
import { ChaptersCRUD } from "../data/repositories/chapters";
import { CreateOrUpdateModal } from "../components/CreateOrUpdateModal";
import { useDisclosure } from "@mantine/hooks";

export function Chapter() {
  const navigate = useNavigate();
  const { bookId, chapterId: rawChapterId } = useParams();
  const chapterId = parseInt(rawChapterId || "-1");

  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [, setCurrentChapterId] = useAtom(currentChapterId);
  const [chapter] = useAtom(currentChapter);
  const [snippets] = useAtom(currentSnippets);

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
            {({ node, style, dragHandle }) => (
              <div ref={dragHandle}>
                <Link
                  to={`/books/${bookId}/chapters/${node.data.chapterId}/snippets/${node.data?.id}`}
                  style={style}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Flex>
                    <SnippetIcon snippet={node.data} />
                    {node.data.label}
                  </Flex>
                </Link>
              </div>
            )}
          </Tree>
        )}
        {(!snippets || snippets?.length === 0) && <div>No Snippets found</div>}
      </Flex>
      <Outlet />

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

// enum SnippetStatus {
//   Unknown = "unknown",
//   New = "new",
//   Processing = "processing",
//   Raw = "raw",
//   Edited = "edited",
//   Finished = "finished",
// }

function SnippetIcon({ snippet }: { snippet: SnippetModel }) {
  // let status = SnippetStatus.Unknown;
  let statusComponent = <IconHelpCircle color="gray" aria-label="Unknown" />;

  if (snippet.content === "" && snippet.recordedAt === 0) {
    // status = SnippetStatus.New;
    statusComponent = <IconCircle color="gray" aria-label="No Content" />;
  } else if (snippet.recordedAt > snippet.processedAt) {
    // status = SnippetStatus.Processing;
    statusComponent = <IconCircleDashed color="blue" aria-label="Processing" />;
  } else if (snippet.processedAt >= snippet.modifiedAt) {
    // status = SnippetStatus.Raw;
    statusComponent = <IconCircleFilled color="gray" aria-label="Unedited" />;
  } else if (snippet.finishedAt < snippet.modifiedAt) {
    // status = SnippetStatus.Edited;
    statusComponent = <IconCircleFilled color="blue" aria-label="Edited" />;
  } else {
    // status = SnippetStatus.Finished;
    statusComponent = <IconCircleCheck color="green" aria-label="Finished" />;
  }

  return <Box mr={4}>{statusComponent}</Box>;
}
