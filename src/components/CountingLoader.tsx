import { Loader, Flex } from "@mantine/core";

import "./CountingLoader.scss";

interface CountingLoaderProps {
  count: number;
  color: string;
}

export function CountingLoader({ count, color = "blue" }: CountingLoaderProps) {
  return (
    <div className="counting-loader">
      <Loader color={color} />
      <Flex className="count" align="center" justify={"center"}>
        {count}
      </Flex>
    </div>
  );
}
