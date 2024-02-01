import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { Demo } from "./Demo";
import { Home } from "./routes/Home";
import { Chapter } from "./routes/Chapter";
import { Snippet } from "./routes/Snippet";
import { LoadingErrorPage } from "./components/LoadingErrorPage";

export const router = createBrowserRouter([
  {
    path: "",
    element: <App />,
    errorElement: <LoadingErrorPage />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "books/:bookId/chapters/:chapterId",
        element: <Chapter />,
        children: [{ path: "snippets/:snippetId", element: <Snippet /> }],
      },
    ],
  },
  {
    path: "/demo",
    element: <Demo />,
  },
]);
