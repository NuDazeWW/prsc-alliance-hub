import { describe, it } from "node:test";
import { deepStrictEqual, throws } from "node:assert";
import { passwordChangeAttributes } from "./password-change";

describe("administrator password recovery", () => {
  it("does not require or send the current password", () => {
    deepStrictEqual(passwordChangeAttributes("A-new-private-pass", "A-new-private-pass"), { password: "A-new-private-pass" });
  });
  it("requires at least twelve characters", () => {
    throws(() => passwordChangeAttributes("12345678901", "12345678901"));
    deepStrictEqual(passwordChangeAttributes("123456789012", "123456789012"), { password: "123456789012" });
  });
  it("requires matching confirmation", () => {
    throws(() => passwordChangeAttributes("A-new-private-pass", "A-different-password"));
  });
});