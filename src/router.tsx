import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Demo } from "./Demo";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/demo",
    element: <Demo />,
  },
]);
