import { Page } from '../enums/page.enum';
import App from '../../components/pages/app/App';
import Feed from '../../components/pages/feed/Feed';
import Entry from '../../components/pages/entry/Entry';
import Entries from '../../components/pages/entries/Entries';
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
        element: <Feed />,
      },
      {
        path: Page.Entries,
        element: <Entries />,
      },
      {
        path: `${Page.Entry}/:entryId`,
        element: <Entry />,
      },
      {
        index: true,
        element: <Navigate to={Page.Feed} />
      }
    ]
  },
]);