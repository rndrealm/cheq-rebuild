// Frontend helper; tested here because vitest only runs convex/**.
import { describe, expect, test } from "vitest";
import { getLockedPoints } from "../../src/lib/helpers/bets";

const ME = "me";
const bet = (
  status: Parameters<typeof getLockedPoints>[0][number]["status"],
  creatorId: string,
  creatorWager = 50,
  opponentWager = 30,
) => ({ status, creatorId, creatorWager, opponentWager });

describe("getLockedPoints", () => {
  test("counts your stake on live bets from either side", () => {
    expect(getLockedPoints([bet("active", ME), bet("active", "them")], ME)).toBe(
      50 + 30,
    );
  });

  test("counts open challenges only when you created them", () => {
    expect(
      getLockedPoints(
        [bet("pending", ME), bet("countered", ME), bet("pending", "them")],
        ME,
      ),
    ).toBe(100);
  });

  test("finished bets lock nothing", () => {
    expect(
      getLockedPoints(
        ["resolved", "tied", "expired", "cancelled"].map((s) =>
          bet(s as "resolved", ME),
        ),
        ME,
      ),
    ).toBe(0);
  });
});
