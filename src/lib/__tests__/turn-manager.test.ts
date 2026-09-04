import { turnManager } from "../turn-manager";

describe("TurnManager", () => {
  it("should create a new turn context", () => {
    const ctx = turnManager.startTurn();
    expect(ctx).toBeDefined();
    expect(ctx.turnId).toBeDefined();
    expect(ctx.generationId).toBeDefined();
  });

  it("should invalidate a turn correctly", () => {
    turnManager.startTurn();
    turnManager.invalidateCurrentTurn();
    expect(turnManager.getActiveContext()).toBeNull();
  });

  it("should detect a stale generation", () => {
    const oldCtx = turnManager.startTurn();
    const newCtx = turnManager.startTurn(); // Start a new one, old becomes stale

    expect(turnManager.isStale(oldCtx.generationId)).toBe(true);
    expect(turnManager.isStale(newCtx.generationId)).toBe(false);
  });
});
