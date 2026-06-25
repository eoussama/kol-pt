import { createHashRouter, Navigate } from "react-router-dom";
import App from "../../components/pages/app/App";
import EntriesPage from "../../components/pages/entries/EntriesPage";
import EntryPage from "../../components/pages/entry/EntryPage";
import FeedPage from "../../components/pages/feed/FeedPage";
import { Page } from "../enums/page.enum";



/**
 * @description
 * The routing hierarchy
 */
export const router = createHashRouter([
  {
    path: Page.Index,
    element: <App />,
    children: [
      {
        path: Page.Feed,
        element: <FeedPage />,
      },
      {
        path: Page.Entries,
        element: <EntriesPage />,
      },
      {
        path: `${Page.Entry}/:entryId`,
        element: <EntryPage />,
      },
      {
        index: true,
        element: <Navigate to={Page.Feed} />,
      },
    ],
  },
]);
