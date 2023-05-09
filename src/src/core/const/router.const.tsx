import Feed from '../../components/pages/feed/Feed';
import Entries from '../../components/pages/entries/Entries';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import App from '../../components/pages/app/App';



/**
 * @description
 * The routing hierarchy
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'feed',
        element: <Feed />,
      },
      {
        path: 'entries',
        element: <Entries />,
      },
      {
        index: true,
        element: <Navigate to='/feed' />
      }
    ]
  },
]);