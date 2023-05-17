import { Page } from '../enums/page.enum';
import App from '../../components/pages/app/App';
import FeedPage from '../../components/pages/feed/Feed';
import EntryPage from '../../components/pages/entry/Entry';
import EntriesPage from '../../components/pages/entries/Entries';
import { Navigate, createHashRouter } from 'react-router-dom';



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
        element: <Navigate to={Page.Feed} />
      }
    ]
  },
]);