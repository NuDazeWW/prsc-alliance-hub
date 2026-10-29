import * as React from "react";
import { test } from "node:test";
import { match, doesNotMatch } from "node:assert";
import { render } from "@react-email/render";
import { InviteEmail } from "./invite";

const basic = {
  confirmationUrl: "https://example.test/accept",
  recipientEmail: "avery@example.test",
  firstName: "avery",
};

test("Forum-only invite fallback uses the approved orientation journey and both hosts", async () => {
  const html = await render(
    <InviteEmail
      {...basic}
      entity="prsc"
      roleLabel="United Forum Invitee"
      whyYou="Your reviewed individual note."
    />,
  );
  match(html, /Your reviewed individual note\./);
  match(html, /Take the 5-Minute Orientation/);
  match(html, /Partnership Readiness Standards Council/);
  match(html, /Decision Intelligence Systems/);
  doesNotMatch(html, /aligned on your role at/);
  doesNotMatch(html, /previously discussed United Forum Invitee role/);
});

test("Forum-only invite preserves administrator copy with neutral entity tokens", async () => {
  const html = await render(
    <InviteEmail
      {...basic}
      entity="dis"
      roleLabel="United Forum Invitee"
      copy={{
        heading: "Your saved heading",
        body: "Saved copy: {{entity}} / {{entity_full}} / {{role}}.",
        cta_label: "Saved action",
      }}
    />,
  );
  match(html, /Your saved heading/);
  match(
    html,
    /Saved copy: United Forum \/ United Strategic Coordination Forum \/ United Forum Invitee\./,
  );
  match(html, /Saved action/);
  doesNotMatch(html, /Take the 5-Minute Orientation/);
});

test("entity-designated invite keeps its existing entity-specific fallback", async () => {
  const html = await render(
    <InviteEmail {...basic} entity="dis" roleLabel="DIS Advisor Candidate" />,
  );
  match(html, /aligned on your role at/);
  match(html, /Decision Intelligence Systems/);
  doesNotMatch(html, /alt="Partnership Readiness Standards Council"/);
});
