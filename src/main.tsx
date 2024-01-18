import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { MantineProvider, Loader, Flex } from "@mantine/core";

import "@mantine/core/styles.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider>
      <Suspense
        fallback={
          <Flex h="100vh" w="100vw" align={"center"} justify={"center"}>
            <Loader />
          </Flex>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </MantineProvider>
  </React.StrictMode>
);
