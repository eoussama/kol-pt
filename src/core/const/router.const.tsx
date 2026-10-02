import { createHashRouter, Navigate } from "react-router";
import App from "../../components/pages/app/App";
import EntriesPage from "../../components/pages/entries/EntriesPage";
import EntryPage from "../../components/pages/entry/EntryPage";
import FeedPage from "../../components/pages/feed/FeedPage";
import HistoryPage from "../../components/pages/history/HistoryPage";
import ReportsPage from "../../components/pages/reports/ReportsPage";
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
        path: EPage.HISTORY,
        element: <HistoryPage />,
      },
      {
        path: EPage.REPORTS,
        element: <ReportsPage />,
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
