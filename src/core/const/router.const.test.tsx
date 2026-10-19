import { EPage } from "../enums/page.enum";
import { router } from "./router.const";



/**
 * @description
 * Goes to a path and reports what the router matched.
 *
 * @param path - The path to go to
 * @returns The matched routes' paths and the last one's parameters
 */
async function visit(path: string) {
  await router.navigate(path);

  return {
    paths: router.state.matches.map(match => match.route.path),
    params: router.state.matches.at(-1)?.params,
  };
}

describe("router", () => {
  it.each([
    ["/feed", EPage.FEED],
    ["/entries", EPage.ENTRIES],
    ["/history", EPage.HISTORY],
    ["/reports", EPage.REPORTS],
  ])("shows %s inside the app", async (path, page) => {
    expect((await visit(path)).paths).toEqual([EPage.INDEX, page]);
  });

  it("shows an entry by its ID", async () => {
    expect(await visit("/entry/e1")).toEqual({
      paths: [EPage.INDEX, `${EPage.ENTRY}/:entryId`],
      params: { entryId: "e1" },
    });
  });

  it("matches the app's root with the redirect to the feed", async () => {
    await visit("/");

    const last = router.state.matches.at(-1)?.route;

    expect(last?.index).toBe(true);
    expect(last?.element).toMatchObject({ props: { to: EPage.FEED } });
  });

  it("falls back to the app alone for an unknown page", async () => {
    await router.navigate("/nowhere");

    expect(router.state.matches.map(match => match.route.path)).toEqual([EPage.INDEX]);
  });
});
