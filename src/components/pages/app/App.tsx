import { Outlet } from "react-router";

import { useAuthSync } from "../../../hooks/auth-sync.hook";
import { useContentSync } from "../../../hooks/content-sync.hook";
import { useProgressSync } from "../../../hooks/progress-sync.hook";
import { useReportsSync } from "../../../hooks/reports-sync.hook";
import { useWatchlistSync } from "../../../hooks/watchlist-sync.hook";
import Header from "../../layout/generic/header/Header";



/**
 * @description
 * The root component of the application.
 * It renders the header and, below it, the current page in its own scroll area,
 * so the header stays in place.
 *
 * @returns {JSX.Element} The JSX representation of the component.
 */
function App(): JSX.Element {
  useAuthSync();
  useWatchlistSync();
  useProgressSync();
  useReportsSync();
  useContentSync();

  return (
    <main className="flex h-full w-full flex-col bg-background text-sm text-foreground">
      <Header />

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </div>
    </main>
  );
}

export default App;
