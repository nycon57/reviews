import { describe, expect, it } from "vitest";
import { matchOpportunityOwnerToUser } from "../attribution";

const users = [
  { id: "u1", email: "Jane.Doe@Example.com" },
  { id: "u2", email: "bob@example.com" },
  { id: "u3", email: null },
];

describe("matchOpportunityOwnerToUser (Salesforce owner attribution)", () => {
  it("matches an owner email to a user, case-insensitively", () => {
    expect(matchOpportunityOwnerToUser("jane.doe@example.com", users)).toBe("u1");
    expect(matchOpportunityOwnerToUser("BOB@EXAMPLE.COM", users)).toBe("u2");
  });

  it("tolerates surrounding whitespace on the owner email", () => {
    expect(matchOpportunityOwnerToUser("  bob@example.com  ", users)).toBe("u2");
  });

  it("returns null (→ Held) when no org user has that email", () => {
    expect(matchOpportunityOwnerToUser("stranger@other.com", users)).toBeNull();
  });

  it("returns null (→ Held) when the opportunity has no owner email", () => {
    expect(matchOpportunityOwnerToUser(null, users)).toBeNull();
    expect(matchOpportunityOwnerToUser(undefined, users)).toBeNull();
    expect(matchOpportunityOwnerToUser("", users)).toBeNull();
  });

  it("does not match a null-email user against an empty owner email", () => {
    expect(matchOpportunityOwnerToUser("   ", users)).toBeNull();
  });

  it("returns null against an empty user list", () => {
    expect(matchOpportunityOwnerToUser("jane.doe@example.com", [])).toBeNull();
  });
});
