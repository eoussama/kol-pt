import { act, renderHook } from "@testing-library/react";
import { useDelayed } from "./delayed.hook";



describe("useDelayed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is false right away, so quick loads show nothing", () => {
    const { result } = renderHook(() => useDelayed(true, 200));

    expect(result.current).toBe(false);
  });

  it("never shows as elapsed before the delay, not even for a moment", () => {
    const seen: Array<boolean> = [];

    renderHook(() => {
      const elapsed = useDelayed(true, 200);

      seen.push(elapsed);

      return elapsed;
    });

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every(elapsed => !elapsed)).toBe(true);
  });

  it("turns true once active for the delay", () => {
    const { result } = renderHook(() => useDelayed(true, 200));

    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it("stays false when it is not active", () => {
    const { result } = renderHook(() => useDelayed(false, 200));

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(false);
  });

  it("waits for nothing when it is not active", () => {
    renderHook(() => useDelayed(false, 200));

    expect(vi.getTimerCount()).toBe(0);
  });

  it("turns false as soon as it stops", () => {
    const { result, rerender } = renderHook(({ active }) => useDelayed(active, 200), { initialProps: { active: true } });

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe(true);

    rerender({ active: false });
    expect(result.current).toBe(false);
  });

  it("counts again from the start when it restarts, and when it stops early never shows", () => {
    const { result, rerender } = renderHook(({ active }) => useDelayed(active, 200), { initialProps: { active: true } });

    act(() => vi.advanceTimersByTime(150));
    rerender({ active: false });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(false);

    rerender({ active: true });
    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe(true);
  });

  it("waits for a new delay when the delay changes", () => {
    const { result, rerender } = renderHook(({ delay }) => useDelayed(true, delay), { initialProps: { delay: 200 } });

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe(true);

    rerender({ delay: 500 });
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe(true);
  });

  it("leaves no timer behind once unmounted", () => {
    const { unmount } = renderHook(() => useDelayed(true, 200));

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
