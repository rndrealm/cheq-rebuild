import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchBinance } from "../lib/tokens";

describe("fetchBinance", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("retries after a network drop", async () => {
    vi.useFakeTimers();
    const ok = new Response("{}");
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(ok);
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchBinance("https://example.test");
    await vi.runAllTimersAsync();

    expect(await pending).toBe(ok);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("resolves to null instead of throwing once attempts run out", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchBinance("https://example.test");
    await vi.runAllTimersAsync();

    expect(await pending).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("passes through a bad status without retrying", async () => {
    const bad = new Response("", { status: 429 });
    const fetchMock = vi.fn().mockResolvedValue(bad);
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchBinance("https://example.test")).toBe(bad);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
