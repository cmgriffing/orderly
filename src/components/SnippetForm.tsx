import { RefObject, useEffect, useState } from "react";
import { TextInput, Textarea, Flex, Group, Button, Box } from "@mantine/core";
import { IconMicrophone, IconTrash } from "@tabler/icons-react";
import { clsx } from "clsx";
import { Link } from "react-router-dom";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { SnippetModel } from "../data/repositories/snippets";

import "./SnippetForm.scss";

interface BaseSnippetProps {
  bookId: string;
  snippet: SnippetModel | undefined;
  contentRef?: RefObject<HTMLTextAreaElement>;
  disabled?: boolean;
  below?: boolean;
  onEditLabel?: (label: string) => void | Promise<void>;
  onEditContent?: (content: string) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onRecord?: () => void | Promise<void>;
}

interface SnippetFormProps extends BaseSnippetProps {
  disabled?: false;
  onEditLabel: (label: string) => void | Promise<void>;
  onEditContent: (content: string) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onRecord: () => void | Promise<void>;
}

interface DisabledSnippetProps extends BaseSnippetProps {
  disabled: true;
}

export function SnippetForm({
  snippet,
  contentRef,
  disabled,
  onEditLabel = () => {},
  onEditContent = () => {},
  onDelete = () => {},
  onRecord = () => {},
  below,
  bookId,
}: SnippetFormProps | DisabledSnippetProps) {
  const [labelValue, setLabelValue] = useState(snippet?.label || "");
  const [contentValue, setContentValue] = useState(snippet?.content || "");

  useEffect(() => {
    setLabelValue(snippet?.label || "");
    setContentValue(snippet?.content || "");
  }, [snippet]);

  const contents = (
    <>
      <Box>
        <Box>Created At: {dayjs(snippet?.createdAt).fromNow()}</Box>
        <Box>Modified At: {dayjs(snippet?.modifiedAt).fromNow()}</Box>
        {!!snippet?.recordedAt && (
          <Box>Recorded At: {dayjs(snippet?.recordedAt).fromNow()}</Box>
        )}
        {!!snippet?.recordedAt && (
          <Box>Processed At: {dayjs(snippet?.processedAt).fromNow()}</Box>
        )}
        {!!snippet?.recordedAt && (
          <Box>Finished At: {dayjs(snippet?.finishedAt).fromNow()}</Box>
        )}
      </Box>

      <TextInput
        label="Label"
        value={labelValue}
        onChange={async (e) => {
          setLabelValue(e.currentTarget.value);
          onEditLabel(e.currentTarget.value);
        }}
        disabled={disabled}
      />
      <Textarea
        ref={contentRef}
        value={contentValue}
        label="Content"
        onInput={async (e) => {
          setContentValue(e.currentTarget.value);
          onEditContent(e.currentTarget.value);
        }}
        disabled={disabled}
      />

      <Group mt={8} justify="space-between">
        <Button
          color="red"
          variant="outline"
          onClick={() => {
            onRecord();
          }}
          disabled={disabled}
        >
          Record Audio
          <IconMicrophone />
        </Button>
        <Button
          color="red"
          onClick={() => {
            onDelete();
          }}
          disabled={disabled}
        >
          Delete <IconTrash />
        </Button>
      </Group>
    </>
  );

  return (
    <>
      {!disabled ? (
        <Flex
          direction="column"
          className={clsx("snippet-form", {
            disabled,
            below: disabled && below,
          })}
        >
          {contents}
        </Flex>
      ) : (
        <Link
          to={`/books/${bookId}/chapters/${snippet?.chapterId}/snippets/${snippet?.id}`}
          className={clsx("snippet-form", {
            disabled,
            below: disabled && below,
          })}
        >
          <div className="contents">{contents}</div>

          <div className="other-snippet-label-wrapper">
            <div className="other-snippet-label">
              {!below ? "Previous" : "Next"}
            </div>
          </div>
        </Link>
      )}
    </>
  );
}
