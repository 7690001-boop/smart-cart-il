import { describe, expect, it } from "vitest";
import { optimizeSingleStore } from "@/lib/optimizer/singleStore";

describe("optimizeSingleStore", () => {
  it("returns a recommended store for demo list", () => {
    const result = optimizeSingleStore("l1");
    expect(result).toBeTruthy();
    expect(result?.recommended).toBeTruthy();
    expect(result?.recommended?.totalAgorot).toBeGreaterThan(0);
  });
});
