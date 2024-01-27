import React, { PropsWithChildren, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Flex } from "@mantine/core";
import { IconMoodPuzzled } from "@tabler/icons-react";

import { appReady } from "../state/main";
import { Title } from "@mantine/core";

interface NotFoundPageWrapperProps {
  hasEntity: boolean;
  entityName: string;
  notFoundContent: React.ReactNode;
}

export function NotFoundPageWrapper({
  hasEntity,
  children,
  notFoundContent,
  entityName,
}: PropsWithChildren<NotFoundPageWrapperProps>) {
  const [is404, setIs404] = useState(false);

  const [ready] = useAtom(appReady);

  useEffect(() => {
    setIs404(!hasEntity && ready);
  }, [hasEntity, ready]);

  return (
    <>
      {!is404 && <>{children}</>}
      {is404 && (
        <Flex align="center" direction="column" w={"100%"} pt="5rem">
          <IconMoodPuzzled size={300} />
          <Title>{entityName} Not Found</Title>
          <Flex mt="2rem">{notFoundContent}</Flex>
        </Flex>
      )}
    </>
  );
}
