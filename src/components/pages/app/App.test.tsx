import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useAuthSync } from "../../../hooks/auth-sync.hook";
import { useContentSync } from "../../../hooks/content-sync.hook";
import { useProgressSync } from "../../../hooks/progress-sync.hook";
import { useReportsSync } from "../../../hooks/reports-sync.hook";
import { useWatchlistSync } from "../../../hooks/watchlist-sync.hook";
import App from "./App";



vi.mock("../../../hooks/auth-sync.hook", () => ({ useAuthSync: vi.fn() }));
vi.mock("../../../hooks/content-sync.hook", () => ({ useContentSync: vi.fn() }));
vi.mock("../../../hooks/progress-sync.hook", () => ({ useProgressSync: vi.fn() }));
vi.mock("../../../hooks/reports-sync.hook", () => ({ useReportsSync: vi.fn() }));
vi.mock("../../../hooks/watchlist-sync.hook", () => ({ useWatchlistSync: vi.fn() }));

describe("app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
  });

  it("keeps the page in sync with storage: the user, the watchlist, the positions, the reports and the content", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(useAuthSync).toHaveBeenCalledOnce();
    expect(useWatchlistSync).toHaveBeenCalledOnce();
    expect(useProgressSync).toHaveBeenCalledOnce();
    expect(useReportsSync).toHaveBeenCalledOnce();
    expect(useContentSync).toHaveBeenCalledOnce();
  });
});
