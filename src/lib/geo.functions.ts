import { createServerFn, getRequest } from "@tanstack/react-start";

// EU/EEA + UK + Switzerland — jurisdictions where ePrivacy/GDPR consent applies
const CONSENT_REQUIRED = new Set([
  // EU
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  // EEA
  "IS", "LI", "NO",
  // UK + Switzerland
  "GB", "CH",
]);

export const getVisitorRegion = createServerFn({ method: "GET" }).handler(() => {
  const req = getRequest();
  const country =
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("x-country-code") ??
    "";
  return {
    country,
    consentRequired: country ? CONSENT_REQUIRED.has(country.toUpperCase()) : true,
  };
});
