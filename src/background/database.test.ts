import { get, ref, set, update } from "firebase/database";
import { readValue, updateValues, writeValue } from "./database";



const database = { kind: "database" };

vi.mock("firebase/database", () => ({
  get: vi.fn(),
  ref: vi.fn((_database: unknown, path: string) => ({ path })),
  set: vi.fn(async () => undefined),
  update: vi.fn(async () => undefined),
}));
vi.mock("./firebase", () => ({ getFirebaseDatabase: () => database }));

describe("database", () => {
  beforeEach(() => {
    vi.mocked(get).mockReset();
    vi.mocked(ref).mockClear();
    vi.mocked(set).mockClear();
    vi.mocked(update).mockClear();
  });

  it("reads the value at a path", async () => {
    vi.mocked(get).mockResolvedValue({ val: () => ({ id: "p1" }) } as never);

    await expect(readValue("posts/p1")).resolves.toEqual({ id: "p1" });
    expect(ref).toHaveBeenCalledWith(database, "posts/p1");
    expect(get).toHaveBeenCalledWith({ path: "posts/p1" });
  });

  it("replaces the value at a path, or deletes it with null", async () => {
    await writeValue("posts/p1", { id: "p1" });
    await writeValue("posts/p2", null);

    expect(set).toHaveBeenNthCalledWith(1, { path: "posts/p1" }, { id: "p1" });
    expect(set).toHaveBeenNthCalledWith(2, { path: "posts/p2" }, null);
    expect(ref).toHaveBeenCalledWith(database, "posts/p1");
  });

  it("updates only the given children", async () => {
    await updateValues("users/u1/settings", { viewMode: 1 });

    expect(ref).toHaveBeenCalledWith(database, "users/u1/settings");
    expect(update).toHaveBeenCalledExactlyOnceWith({ path: "users/u1/settings" }, { viewMode: 1 });
  });
});
