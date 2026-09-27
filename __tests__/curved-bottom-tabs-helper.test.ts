import {
  calculateTabPosition,
  processGradient,
} from "@/components/curved-bottom-tabs/helper";

describe("curved bottom tabs helpers", () => {
  test("normalizes missing and single-color gradients", () => {
    expect(processGradient()).toEqual(["#6366f1", "#8b5cf6"]);
    expect(processGradient(["#123456"])).toEqual(["#123456", "#123456"]);
  });

  test("places tabs symmetrically around the screen center", () => {
    const first = calculateTabPosition(0, 5);
    const middle = calculateTabPosition(2, 5);
    const last = calculateTabPosition(4, 5);

    expect(first).toBeLessThan(middle);
    expect(last).toBeGreaterThan(middle);
    expect(first + last).toBeCloseTo(middle * 2);
  });
});
