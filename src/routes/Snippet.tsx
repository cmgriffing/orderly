import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { TextInput, Textarea, Flex } from "@mantine/core";
import { useAtom } from "jotai";
import {
  currentSnippet,
  currentSnippetId,
  fetchTimestamp,
} from "../state/main";
import { SnippetsCRUD } from "../data/repositories/snippets";

function mockRecord() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
      );
    }, 5000);
  });
}

export function Snippet() {
  const { bookId, chapterId, snippetId: rawSnippetId } = useParams();
  const snippetId = parseInt(rawSnippetId || "-1");
  const [, setFetchTimestamp] = useAtom(fetchTimestamp);
  const [, setCurrentSnippetId] = useAtom(currentSnippetId);
  const [snippet] = useAtom(currentSnippet);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentSnippetId(snippetId);
  }, [snippetId, setCurrentSnippetId]);

  return (
    <Flex direction={"column"} w="100%" maw={"600px"} mx={"auto"} px={24}>
      <TextInput
        label="Label"
        defaultValue={snippet?.label}
        onChange={async (e) => {
          if (snippet) {
            await SnippetsCRUD.update(snippet?.id, {
              label: e.currentTarget.value,
            });
            setFetchTimestamp(Date.now());
          }
        }}
      />
      <Textarea
        ref={contentRef}
        defaultValue={snippet?.content}
        label="Content"
        onInput={async (e) => {
          await SnippetsCRUD.update(snippetId, {
            content: e.currentTarget.value,
          });
          setFetchTimestamp(Date.now());
        }}
      />
    </Flex>
  );
}
