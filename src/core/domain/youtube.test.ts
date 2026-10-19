import type { TYouTubeEntry } from "../schemas/entry/youtube-entry.schema";

import { EEntryType } from "../enums/entry-type.enum";
import { YouTube } from "./youtube";



const model: TYouTubeEntry = { id: "e2", title: "Some Channel", type: EEntryType.YOUTUBE, altTitles: [] };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("youtube identifiers", () => {
  it("keeps the handle and channel ID", () => {
    const channel = new YouTube({ ...model, handle: "somechannel", channelId: "UC1" });

    expect([channel.handle, channel.channelId]).toEqual(["somechannel", "UC1"]);
  });

  it("defaults them to empty", () => {
    const channel = new YouTube(model);

    expect([channel.handle, channel.channelId]).toEqual(["", ""]);
  });
});

describe("youtube menu", () => {
  it("lists the video, the channel, then the shared options", () => {
    const options = new YouTube({ ...model, imdbId: "tt1" }).getOptions({ videoId: "abc" });

    expect(options.map(o => o.label)).toEqual(["Watch on YouTube", "View Some Channel Channel", "View on IMDb"]);
  });

  it("separates the video link from the rest", () => {
    const [video, channel] = new YouTube(model).getOptions({ videoId: "abc" });

    expect(video?.divider).toBe(true);
    expect(channel?.divider).toBeUndefined();
  });

  it("offers the video only when the reaction names one", () => {
    const channel = new YouTube(model);
    const video = (context?: Record<string, unknown>) => channel.getOptions(context)[0];

    expect(video({ videoId: "abc" })?.canShow()).toBe(true);
    expect(video({ videoId: "" })?.canShow()).toBe(false);
    expect(video({})?.canShow()).toBe(false);
    expect(video()?.canShow()).toBe(false);
  });

  it("offers the channel only when it has a handle", () => {
    const channel = (handle?: string) => new YouTube({ ...model, handle }).getOptions()[1];

    expect(channel("somechannel")?.canShow()).toBe(true);
    expect(channel()?.canShow()).toBe(false);
  });

  it("opens the video and the channel", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const [video, channel] = new YouTube({ ...model, handle: "somechannel" }).getOptions({ videoId: "abc" });

    video?.action();
    channel?.action();

    expect(open.mock.calls.map(([url]) => url)).toEqual([
      "https://www.youtube.com/watch?v=abc",
      "https://www.youtube.com/@somechannel",
    ]);
  });

  it("opens nothing meaningful for a video the reaction does not name", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    new YouTube(model).getOptions({})[0]?.action();

    expect(open).toHaveBeenCalledExactlyOnceWith("https://www.youtube.com/watch?v=", "_blank", "noopener,noreferrer");
  });

  it("describes the icons", () => {
    const [video, channel] = new YouTube(model).getOptions();

    expect(video).toMatchObject({ iconAlt: "YouTube icon", icon: expect.stringContaining("/images/platforms/youtube.png") });
    expect(channel).toMatchObject({ iconAlt: "YouTube icon", icon: expect.stringContaining("/images/platforms/youtube.png") });
  });
});
