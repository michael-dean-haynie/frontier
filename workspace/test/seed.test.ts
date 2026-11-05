import { describe, it, expect } from "vitest";
import { execute } from "./helpers.js";

/**
 * Seed smoke test: proves the toolchain and schema wiring work end to end.
 * Exercises will add their own `*.test.ts` files that start red.
 */
describe("seed", () => {
  it("resolves the ping liveness probe", async () => {
    const result = await execute(`{ ping }`);
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ ping: "pong" });
  });
});
