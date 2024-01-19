/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Flex } from "@mantine/core";

import {
  IconHelpCircle,
  IconCircle,
  IconCircleDashed,
  IconCircleFilled,
  IconCircleCheck,
  TablerIconsProps,
} from "@tabler/icons-react";

import { SnippetModel } from "../data/repositories/snippets";

export enum SnippetStatus {
  Unknown,
  New,
  Processing,
  Raw,
  Edited,
  Finished,
}

export function getSnippetStatus(snippet?: SnippetModel): SnippetStatus {
  if (!snippet) {
    return SnippetStatus.Unknown;
  }

  if (snippet.content === "" && snippet.recordedAt === 0) {
    return SnippetStatus.New;
  } else if (snippet.recordedAt > snippet.processedAt) {
    return SnippetStatus.Processing;
  } else if (snippet.processedAt >= snippet.modifiedAt) {
    return SnippetStatus.Raw;
  } else if (snippet.finishedAt < snippet.modifiedAt) {
    return SnippetStatus.Edited;
  } else {
    return SnippetStatus.Finished;
  }
}

const iconLookupTable: Record<
  SnippetStatus,
  {
    color: string;
    label: string;
    component: (props: TablerIconsProps) => Element;
  }
> = {
  [SnippetStatus.Unknown]: {
    color: "gray",
    label: "Unknown",
    component: IconHelpCircle as any,
  },
  [SnippetStatus.New]: {
    color: "gray",
    label: "No Content",
    component: IconCircle as any,
  },
  [SnippetStatus.Processing]: {
    color: "blue",
    label: "Processing",
    component: IconCircleDashed as any,
  },
  [SnippetStatus.Raw]: {
    color: "gray",
    label: "Unedited",
    component: IconCircleFilled as any,
  },
  [SnippetStatus.Edited]: {
    color: "blue",
    label: "Edited",
    component: IconCircleCheck as any,
  },
  [SnippetStatus.Finished]: {
    color: "green",
    label: "Finished",
    component: IconCircleCheck as any,
  },
};

export function SnippetStatusIcon({
  snippet,
  height,
}: {
  snippet?: SnippetModel;
  height: number;
}) {
  const status = getSnippetStatus(snippet);
  const statusComponent = iconLookupTable[status];
  const Component = statusComponent.component as any;

  return (
    <Component
      height={height}
      color={statusComponent.color}
      aria-label={statusComponent.label}
    />
  );
}
