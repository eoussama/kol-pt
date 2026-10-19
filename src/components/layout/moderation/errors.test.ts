import { describeError } from "./errors";



describe("describeError", () => {
  it("explains a refused database change", () => {
    expect(describeError(new Error("Missing or insufficient permissions."))).toBe("The database refused this change. Check that you are still allowed to make it.");
    expect(describeError("PERMISSION_DENIED")).toBe("The database refused this change. Check that you are still allowed to make it.");
  });

  it("passes any other error's message on", () => {
    expect(describeError(new Error("Offline"))).toBe("Offline");
    expect(describeError("Offline")).toBe("Offline");
  });

  it("falls back to a generic sentence when there is no message", () => {
    expect(describeError(Object.assign(new Error("placeholder"), { message: "" }))).toBe("Something went wrong. Try again.");
    expect(describeError("")).toBe("Something went wrong. Try again.");
  });
});
