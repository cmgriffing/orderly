import React from "react";
import { Flex, Title, Text } from "@mantine/core";
import { IconMoodPuzzled } from "@tabler/icons-react";

export function LoadingErrorPage() {
  return (
    <Flex
      align="center"
      justify={"center"}
      direction="column"
      miw={"100vw"}
      mih={"100vh"}
      pos={"absolute"}
      top={"0"}
      p="2rem"
    >
      <IconMoodPuzzled size={200} />
      <Title>Error loading libraries and database</Title>
      <Flex direction="column" maw="600px">
        <Text>
          The root of the issue is in how the browser gives permission for{" "}
          <a
            target="_blank"
            href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system"
          >
            OPFS
          </a>{" "}
          access. The following things have been known to cause this problem:
        </Text>
        <ul>
          <li>Private and Incognito windows</li>
          <li>Ublock Origin and other ad-blockers</li>
          <li>
            Firefox "Never Remember History". The setting can be found here{" "}
            <a target="_blank" href="about:preferences#privacy">
              about:preferences#privacy
            </a>
          </li>
        </ul>
        <Text>
          To use this app, you will need to disable any and all of those
          features. This app uses minimal GDPR-compliant analytics via Plausible
          to measure usage. No other data is sent out of your browser to a
          server.
        </Text>
      </Flex>
    </Flex>
  );
}
