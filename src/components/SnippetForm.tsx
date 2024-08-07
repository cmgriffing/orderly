import { useEffect, useState } from "react";
import {
  TextInput,
  Textarea,
  Flex,
  Group,
  Button,
  Popover,
  Text,
} from "@mantine/core";
import { useDebouncedCallback } from "use-debounce";
import {
  IconMicrophone,
  IconTrash,
  IconCaretDownFilled,
} from "@tabler/icons-react";
import { clsx } from "clsx";
import { Link } from "react-router-dom";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { SnippetModel } from "../data/repositories/snippets";

import {
  SnippetStatus,
  SnippetStatusIcon,
  getSnippetStatus,
} from "./SnippetStatusIcon";

import "./SnippetForm.scss";

interface BaseSnippetProps {
  bookId: string;
  snippet: SnippetModel | undefined;
  disabled?: boolean;
  below?: boolean;
  onEditLabel?: (label: string) => void | Promise<void>;
  onEditContent?: (content: string) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onRecord?: () => void | Promise<void>;
  whisperResult?: string;
}

interface SnippetFormProps extends BaseSnippetProps {
  disabled?: false;
  onEditLabel: (label: string) => void | Promise<void>;
  onEditContent: (content: string) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onRecord: () => void | Promise<void>;
  whisperResult: string;
}

interface DisabledSnippetProps extends BaseSnippetProps {
  disabled: true;
}

export function SnippetForm({
  snippet,
  disabled,
  onEditLabel = () => {},
  onEditContent = () => {},
  onDelete = () => {},
  onRecord = () => {},
  below,
  bookId,
  whisperResult,
}: SnippetFormProps | DisabledSnippetProps) {
  const [labelValue, setLabelValue] = useState(snippet?.label || "");
  const [contentValue, setContentValue] = useState(snippet?.content || "");
  const debouncedEditLabel = useDebouncedCallback(onEditLabel, 500);
  const debouncedEditContent = useDebouncedCallback(onEditContent, 500);

  const status = getSnippetStatus(snippet);

  useEffect(() => {
    setLabelValue(snippet?.label || "");
    setContentValue(snippet?.content || "");
  }, [snippet]);

  useEffect(() => {
    if (whisperResult) {
      setContentValue(whisperResult);
    }
  }, [whisperResult]);

  const contents = (
    <>
      <Flex justify={"flex-end"}>
        <Popover width={240} trapFocus position="bottom" withArrow shadow="md">
          <Popover.Target>
            <Button
              variant={"outline"}
              leftSection={<SnippetStatusIcon snippet={snippet!} height={24} />}
              rightSection={<IconCaretDownFilled width={12} />}
            >
              Status
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Flex justify={"space-between"}>
              <Text>Status:</Text> <Text>{SnippetStatus[status]}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text>Created:</Text>
              {dayjs(snippet?.createdAt).fromNow()}
            </Flex>
            <Flex justify="space-between">
              <Text>Modified:</Text>
              {dayjs(snippet?.modifiedAt).fromNow()}
            </Flex>
            {snippet &&
              snippet?.recordedAt > 0 &&
              status > SnippetStatus.New && (
                <Flex justify="space-between">
                  <Text>Recorded:</Text>
                  {dayjs(snippet?.recordedAt).fromNow()}
                </Flex>
              )}
            {snippet &&
              snippet?.processedAt > 0 &&
              status > SnippetStatus.Processing && (
                <Flex justify="space-between">
                  <Text>Processed:</Text>
                  {dayjs(snippet?.processedAt).fromNow()}
                </Flex>
              )}
            {/* {status > SnippetStatus.Raw && status <= SnippetStatus.Finished && (
              <Flex justify="space-between">
                <Text>Finished:</Text>
                {dayjs(snippet?.finishedAt).fromNow()}
              </Flex>
            )} */}
          </Popover.Dropdown>
        </Popover>
      </Flex>

      <TextInput
        label="Label"
        value={labelValue}
        onChange={async (e) => {
          setLabelValue(e.currentTarget.value);
          debouncedEditLabel(e.currentTarget.value);
        }}
        disabled={disabled}
      />
      <Textarea
        value={contentValue}
        label="Content"
        rows={!disabled ? 7 : 2}
        onInput={async (e) => {
          setContentValue(e.currentTarget.value);
          debouncedEditContent(e.currentTarget.value);
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
          rightSection={<IconMicrophone />}
        >
          Record Audio
        </Button>
        <Button
          color="red"
          onClick={() => {
            onDelete();
          }}
          disabled={disabled}
          rightSection={<IconTrash />}
        >
          Delete
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
