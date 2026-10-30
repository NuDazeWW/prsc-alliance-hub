import { describe, it, expect } from "vitest";
import { passwordChangeAttributes } from "./password-change";

describe("administrator password recovery", () => {
  it("does not require or send the current password", () => {
    expect(passwordChangeAttributes("A-new-private-pass", "A-new-private-pass")).toEqual({ password: "A-new-private-pass" });
  });
  it("requires at least twelve characters", () => {
    expect(() => passwordChangeAttributes("12345678901", "12345678901")).toThrow();
    expect(passwordChangeAttributes("123456789012", "123456789012")).toEqual({ password: "123456789012" });
  });
  it("requires matching confirmation", () => {
    expect(() => passwordChangeAttributes("A-new-private-pass", "A-different-password")).toThrow();
  });
});