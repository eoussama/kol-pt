import type { TPage } from "../../../../core/enums/page.enum";

import { LogIn, LogOut } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { EPage } from "../../../../core/enums/page.enum";
import { getImageUrl } from "../../../../core/utils/assets";
import { openDiscord, openPatreon, openProject } from "../../../../core/utils/links";
import { useAuth } from "../../../../hooks/auth.hook";
import { useAuthStore } from "../../../../state/auth.state";
import { usePostStore } from "../../../../state/posts.state";
import { useReportsStore } from "../../../../state/reports.state";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";
import { Button } from "../../../ui/button";
import { Separator } from "../../../ui/separator";
import { Tabs, TabsList, TabsTrigger } from "../../../ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";



/**
 * @description
 * A platform logo drawn in the current text color, so it reads in both themes
 * whatever the colors of the bundled image.
 *
 * @param props - The icon's properties
 * @param props.name - The platform image's name
 * @returns The rendered icon
 */
function PlatformIcon({ name }: { name: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="size-4 rounded-sm bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
      style={{ maskImage: `url(${getImageUrl(name, "platforms")})` }}
    />
  );
}

/**
 * @description
 * The Header component renders the application's header, including the logo and title,
 * and provides the user with the ability to open the Patreon page in a new tab.
 *
 * @returns {JSX.Element} The JSX representation of the component.
 */
function Header(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const loadPosts = usePostStore(e => e.loadPosts);
  const { photo, email, onLogin, onLogout, isLoggedIn } = useAuth();
  const moderator = useAuthStore(e => e.moderator);
  const reportCount = useReportsStore(e => e.reports.length);
  const tabs: Array<string> = moderator ? [EPage.FEED, EPage.ENTRIES, EPage.HISTORY, EPage.REPORTS] : [EPage.FEED, EPage.ENTRIES, EPage.HISTORY];

  /**
   * @description
   * Memorizes the current route
   */
  const route = useMemo(() => {
    const path = location.pathname;
    const frags = path.split("/");
    const sanitizedFrags = frags.filter(e => e.length > 0);

    return sanitizedFrags[0];
  }, [location.pathname]);

  /**
   * @description
   * Condition to show/hide the tabs
   */
  const canShowTabs = ([EPage.FEED, EPage.ENTRIES, EPage.HISTORY, EPage.REPORTS] as Array<string>).includes(route ?? "");

  /**
   * @description
   * The selected tab, derived from the route so it stays in sync with
   * navigation that does not go through the tabs
   */
  const tab = tabs[Math.max(0, tabs.indexOf(route ?? ""))];

  /**
   * @description
   * Handles the click event of the avatar to refresh the post list.
   */
  const onRefresh = () => {
    loadPosts(false);
  };

  /**
   * @description
   * Handles page redirects
   *
   * @param page The target page
   */
  const onTabChange = (page: TPage) => {
    navigate(page);
  };

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b bg-background">
      <div className="flex h-12 items-center gap-2 pr-2 pl-3">
        <Tooltip>
          <TooltipTrigger
            render={(
              <button
                type="button"
                onClick={openProject}
                className="-ml-1 flex min-w-0 items-center gap-2 rounded-lg p-1 pr-1.5 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            )}
          >
            <img src="/icons/icon48x48.png" width={48} height={48} alt="" className="size-8 shrink-0" />

            <span className="text-sm font-semibold tracking-tight">KOL PT</span>
            <span className="text-xs text-muted-foreground tabular-nums">{`v${__APP_VERSION__}`}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open the project page</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Opens KOL's Discord server" onClick={openDiscord} className="text-muted-foreground hover:text-foreground" />}
            >
              <PlatformIcon name="discord" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Open Discord</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Open Patreon" onClick={openPatreon} className="text-muted-foreground hover:text-foreground" />}
            >
              <PlatformIcon name="patreon" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Open Patreon</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1.5 h-4 w-px data-vertical:self-center" />

          {!isLoggedIn()
            && (
              <Button size="sm" onClick={onLogin}>
                <LogIn data-icon="inline-start" />
                Login
              </Button>
            )}

          {isLoggedIn() && (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={(
                    <button
                      type="button"
                      onClick={onRefresh}
                      aria-label={`Signed in as ${email}, refresh posts`}
                      className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  )}
                >
                  <Avatar className="size-7">
                    <AvatarImage src={photo} alt="" />
                    <AvatarFallback className="text-xs font-medium uppercase">{email.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="flex-col items-start gap-0">
                  <span className="font-medium">{email}</span>
                  <span className="opacity-70">Click to refresh posts</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={<Button variant="ghost" size="icon-sm" onClick={onLogout} aria-label="logout" className="text-muted-foreground" />}
                >
                  <LogOut />
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">Logout</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {canShowTabs && (
        <nav className="px-2">
          <Tabs
            value={tab}
            onValueChange={value => onTabChange(value as TPage)}
          >
            <TabsList variant="line" aria-label="Main navigation tabs" className="w-full">
              <TabsTrigger value={EPage.FEED}>Feed</TabsTrigger>
              <TabsTrigger value={EPage.ENTRIES}>Entries</TabsTrigger>
              <TabsTrigger value={EPage.HISTORY}>History</TabsTrigger>
              {moderator && (
                <TabsTrigger value={EPage.REPORTS}>
                  Reports
                  {reportCount > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 text-[0.625rem] font-semibold text-warning tabular-nums">
                      {reportCount > 99 ? "99+" : reportCount}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </nav>
      )}
    </header>
  );
}

export default Header;
