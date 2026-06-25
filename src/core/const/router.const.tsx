import { createHashRouter, Navigate } from "react-router-dom";
import App from "../../components/pages/app/App";
import EntriesPage from "../../components/pages/entries/EntriesPage";
import EntryPage from "../../components/pages/entry/EntryPage";
import FeedPage from "../../components/pages/feed/FeedPage";
import { EPage } from "../enums/page.enum";



/**
 * @description
 * The routing hierarchy
 */
export const router = createHashRouter([
  {
    path: EPage.INDEX,
    element: <App />,
    children: [
      {
        path: EPage.FEED,
        element: <FeedPage />,
      },
      {
        path: EPage.ENTRIES,
        element: <EntriesPage />,
      },
      {
        path: `${EPage.ENTRY}/:entryId`,
        element: <EntryPage />,
      },
      {
        index: true,
        element: <Navigate to={EPage.FEED} />,
      },
    ],
  },
]);
