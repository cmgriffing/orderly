import { Flex, Title, Text, Image } from "@mantine/core";

export function Home() {
  return (
    <Flex align={"center"} pt="4rem" miw="100%" w="100%" direction="column">
      <Image src="/orderly/orderly.svg" alt="Orderly Logo" w="300px" />
      <Title order={1} mt="2rem" mb="1rem">
        Welcome to Orderly
      </Title>
      <Text w="300px">
        Orderly is your local-first dictation-based writing tool. The current
        focus of this proof-of-concept is for writing books. However, it has
        plenty of room to grow.
      </Text>
    </Flex>
  );
}
