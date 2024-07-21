import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import "@mantine/core/styles.css";
import "./index.css";
import "@mantine/notifications/styles.css";

import { AppLoader } from "./components/AppLoader";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider>
      <Notifications />
      <Suspense fallback={<AppLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </MantineProvider>
  </React.StrictMode>
);
