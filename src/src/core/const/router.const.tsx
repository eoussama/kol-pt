import { Page } from '../enums/page.enum';
import App from '../../components/pages/app/App';
import Feed from '../../components/pages/feed/Feed';
import Entries from '../../components/pages/entries/Entries';
import { Navigate, createBrowserRouter, createHashRouter } from 'react-router-dom';



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
        index: true,
        element: <Navigate to={Page.Feed} />
      }
    ]
  },
]);