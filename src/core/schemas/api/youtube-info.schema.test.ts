import { YouTubeInfoSchema } from "./youtube-info.schema";



const info = { description: "Anime reactions", thumbnail: "https://cdn.test/c.jpg" };

describe("youTubeInfoSchema", () => {
  it("reads a channel without counts", () => {
    expect(YouTubeInfoSchema.parse(info)).toEqual(info);
  });

  it("reads the view and subscriber counts", () => {
    expect(YouTubeInfoSchema.parse({ ...info, totalViews: 1000, subscribers: 20 })).toEqual({ ...info, totalViews: 1000, subscribers: 20 });
  });

  it.each(["description", "thumbnail"])("requires %s", (field) => {
    expect(YouTubeInfoSchema.safeParse({ ...info, [field]: undefined }).success).toBe(false);
  });

  it("rejects counts that are not numbers", () => {
    expect(YouTubeInfoSchema.safeParse({ ...info, totalViews: "1000" }).success).toBe(false);
    expect(YouTubeInfoSchema.safeParse({ ...info, subscribers: "20" }).success).toBe(false);
  });
});
