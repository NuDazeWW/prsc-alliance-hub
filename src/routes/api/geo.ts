import { createFileRoute } from "@tanstack/react-router";

const CONSENT_REQUIRED = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "IS",
  "LI",
  "NO",
  "GB",
  "CH",
]);

export const Route = createFileRoute("/api/geo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const country =
          request.headers.get("cf-ipcountry") ??
          request.headers.get("x-vercel-ip-country") ??
          request.headers.get("x-country-code") ??
          "";
        const consentRequired = country ? CONSENT_REQUIRED.has(country.toUpperCase()) : true; // fail closed — require consent if unknown
        return Response.json(
          { country, consentRequired },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
