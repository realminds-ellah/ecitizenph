import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sendSms, emessageConfigured } from "./emessage.mjs";
import * as ereport from "./ereport.mjs";

// Minimal .env loader (no dependency) — reads server/.env if present so
// secrets never have to be exported by hand in dev.
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const PORT = process.env.PORT || 8787;
// URL of eVerify's real verify/query endpoint — not published in the SDK
// docs excerpt we were given, so this is left configurable rather than
// guessed. Set it once the hackathon organizers provide it.
const EVERIFY_VERIFY_URL = process.env.EVERIFY_VERIFY_URL;
// Private secret key for server-to-server calls to eVerify. Never exposed
// to the browser — only the SDK's public key (VITE_EVERIFY_PUBLIC_KEY)
// is safe client-side.
const EVERIFY_SECRET_KEY = process.env.EVERIFY_SECRET_KEY;

const EVERIFY_REQUIRED_FIELDS = ["first_name", "last_name", "birth_date", "face_liveness_session_id"];
const COMPLAINT_REQUIRED_FIELDS = [
  "mobile", "first_name", "last_name", "gender", "complainant_email",
  "report_type", "subject", "message",
  "region_code", "province_code", "municipality_code", "barangay_code",
];
const EREPORT_DATASETS = new Set(["report_types", "regions", "provinces", "municipalities", "barangays"]);
const APPLICATION_REQUIRED_FIELDS = ["mobile", "first_name", "program_name", "agency", "case_number"];

// eGovPH SSO — not a hackathon sandbox API we were given credentials for, so
// this stays a config-gated stub (same 501 pattern as everything else) until
// a real token-exchange endpoint exists. See DevHandoffPanel in the frontend
// for the intended UX: Profile tab's "Linked Accounts" simulates what this
// would return today.
const SSO_TOKEN_URL = process.env.EGOVPH_SSO_TOKEN_URL;
const SSO_CLIENT_SECRET = process.env.EGOVPH_SSO_CLIENT_SECRET;

// DBM Compass (budget transparency) — situational per the integration
// review: strongest fit is cross-referencing eReport complaints about
// project delays/fund misuse against real appropriations data.
const DBM_COMPASS_BASE_URL = process.env.DBM_COMPASS_BASE_URL;
const DBM_COMPASS_API_KEY = process.env.DBM_COMPASS_API_KEY;

// eGovPay (digital payments) — situational; nothing in this prototype
// currently charges a fee, so this is scaffolded for whenever that changes
// rather than wired to a real UI flow yet.
const EGOVPAY_BASE_URL = process.env.EGOVPAY_BASE_URL;
const EGOVPAY_API_KEY = process.env.EGOVPAY_API_KEY;

// eGov AI (document intelligence) — situational; there's no file-upload
// surface in this prototype yet (ApplyModal is a self-attestation checklist
// by design, see the comment above that component), so this has nothing to
// process until one exists.
const EGOV_AI_BASE_URL = process.env.EGOV_AI_BASE_URL;
const EGOV_AI_API_KEY = process.env.EGOV_AI_API_KEY;

function verificationSmsMessage(firstName) {
  return `eGovPH: Kumusta, ${firstName}! Na-verify na ang iyong PhilSys ID sa eCitizenPH. Kung hindi ikaw ang humiling nito, mangyaring makipag-ugnayan sa amin agad.`;
}

function complaintSmsMessage(caseNumber) {
  return caseNumber
    ? `eGovPH: Naitala na ang iyong report (Case #: ${caseNumber}). Susubaybayan namin ito. Panatilihin ang case number na ito para sa follow-up.`
    : `eGovPH: Natanggap na ang iyong report. Susubaybayan namin ito.`;
}

function applicationSmsMessage(firstName, programName, caseNumber) {
  return `eGovPH: Kumusta, ${firstName}! Naitala na ang iyong aplikasyon para sa ${programName} (Case #: ${caseNumber}). Susubaybayan namin ang status nito.`;
}

// eMessage wants "+63..."; eReport's own `mobile` example is "639...", so
// this normalizes either shape to the one eMessage documented.
function toSmsNumber(mobile) {
  if (!mobile) return mobile;
  return mobile.startsWith("+") ? mobile : `+${mobile.replace(/^0/, "63")}`;
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || "{}");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://internal");
  const path = url.pathname;

  // ── eVerify ──────────────────────────────────────────────────────────
  if (req.method === "POST" && path === "/api/verify") {
    if (!EVERIFY_VERIFY_URL || !EVERIFY_SECRET_KEY) {
      sendJson(res, 501, {
        error: "not_configured",
        message: "Set EVERIFY_VERIFY_URL and EVERIFY_SECRET_KEY in server/.env to enable real eVerify submission.",
      });
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const missing = EVERIFY_REQUIRED_FIELDS.filter((field) => !payload[field]);
    if (missing.length) {
      sendJson(res, 400, { error: "missing_fields", fields: missing });
      return;
    }

    try {
      const upstream = await fetch(EVERIFY_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${EVERIFY_SECRET_KEY}` },
        body: JSON.stringify(payload),
      });
      const data = await upstream.json().catch(() => ({}));

      // On a successful identity verification, notify the citizen via SMS
      // (eMessage). Best-effort: a notification failure doesn't undo a
      // successful verification, so it's surfaced in `sms` rather than
      // changing the response status.
      let sms;
      if (upstream.ok && payload.mobile_number) {
        sms = await sendSms(toSmsNumber(payload.mobile_number), verificationSmsMessage(payload.first_name));
      }

      sendJson(res, upstream.status, { ...data, sms });
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  // ── eReport: datasets (report_types/regions/provinces/municipalities/barangays) ──
  const datasetMatch = path.match(/^\/api\/ereport\/datasets\/([a-z_]+)$/);
  if (req.method === "GET" && datasetMatch) {
    const name = datasetMatch[1];
    if (!EREPORT_DATASETS.has(name)) {
      sendJson(res, 404, { error: "unknown_dataset", name });
      return;
    }
    if (!ereport.ereportConfigured()) {
      sendJson(res, 501, { error: "not_configured", message: "Set EREPORT_BASE_URL and EREPORT_ACCESS_CODE in server/.env to enable eReport." });
      return;
    }
    try {
      const params = Object.fromEntries(url.searchParams);
      const { status, data } = await ereport.getDataset(name, params);
      sendJson(res, status, data);
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  // ── eReport: submit a complaint ─────────────────────────────────────
  if (req.method === "POST" && path === "/api/ereport/complaint") {
    if (!ereport.ereportConfigured()) {
      sendJson(res, 501, { error: "not_configured", message: "Set EREPORT_BASE_URL and EREPORT_ACCESS_CODE in server/.env to enable eReport." });
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }

    const missing = COMPLAINT_REQUIRED_FIELDS.filter((field) => !payload[field]);
    if (missing.length) {
      sendJson(res, 400, { error: "missing_fields", fields: missing });
      return;
    }

    try {
      const { ok, status, data } = await ereport.submitComplaint(payload);

      // Pairs with eMessage: on a successful submission, SMS the citizen a
      // confirmation with their case number, the same way /api/verify does
      // for identity verification.
      let sms;
      if (ok && payload.mobile) {
        const caseNumber = data?.case_number || data?.data?.case_number;
        sms = await sendSms(toSmsNumber(payload.mobile), complaintSmsMessage(caseNumber));
      }

      sendJson(res, status, { ...data, sms });
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  // ── eReport: OTP request/verify (view-token gate for checking report status) ──
  if (req.method === "POST" && path === "/api/ereport/otp/request") {
    if (!ereport.ereportConfigured()) {
      sendJson(res, 501, { error: "not_configured", message: "Set EREPORT_BASE_URL and EREPORT_ACCESS_CODE in server/.env to enable eReport." });
      return;
    }
    try {
      const { email } = await readJsonBody(req);
      if (!email) { sendJson(res, 400, { error: "missing_fields", fields: ["email"] }); return; }
      const { status, data } = await ereport.requestOtp(email);
      sendJson(res, status, data);
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  if (req.method === "POST" && path === "/api/ereport/otp/verify") {
    if (!ereport.ereportConfigured()) {
      sendJson(res, 501, { error: "not_configured", message: "Set EREPORT_BASE_URL and EREPORT_ACCESS_CODE in server/.env to enable eReport." });
      return;
    }
    try {
      const { email, otp } = await readJsonBody(req);
      if (!email || !otp) { sendJson(res, 400, { error: "missing_fields", fields: ["email", "otp"].filter((f) => !{ email, otp }[f]) }); return; }
      const { status, data, viewToken } = await ereport.verifyOtp(email, otp);
      sendJson(res, status, { ...data, view_token: viewToken });
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  // ── eReport: view reports (requires the OTP-issued view token) ─────
  if (req.method === "GET" && path === "/api/ereport/reports") {
    const viewToken = req.headers["x-ereport-view-token"];
    if (!viewToken) { sendJson(res, 401, { error: "missing_view_token" }); return; }
    try {
      const { status, data } = await ereport.getReports(viewToken);
      sendJson(res, status, data);
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  const caseMatch = path.match(/^\/api\/ereport\/reports\/([^/]+)$/);
  if (req.method === "GET" && caseMatch) {
    const viewToken = req.headers["x-ereport-view-token"];
    if (!viewToken) { sendJson(res, 401, { error: "missing_view_token" }); return; }
    try {
      const { status, data } = await ereport.getReportByCaseNumber(decodeURIComponent(caseMatch[1]), viewToken);
      sendJson(res, status, data);
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  // ── eMessage: notify on eCitizenPH program application ──────────────
  // Same eMessage credentials as /api/verify and /api/ereport/complaint —
  // no separate config needed. This is the "tell citizens what happened"
  // gap the integration review flagged: previously only eVerify and
  // eReport fired a confirmation SMS; program applications (ApplyModal)
  // didn't. Best-effort like the other two call sites — a failed SMS
  // doesn't fail the application itself.
  if (req.method === "POST" && path === "/api/notify-application") {
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "invalid_json" });
      return;
    }
    const missing = APPLICATION_REQUIRED_FIELDS.filter((field) => !payload[field]);
    if (missing.length) {
      sendJson(res, 400, { error: "missing_fields", fields: missing });
      return;
    }
    const sms = await sendSms(
      toSmsNumber(payload.mobile),
      applicationSmsMessage(payload.first_name, payload.program_name, payload.case_number)
    );
    sendJson(res, 200, { ok: true, sms });
    return;
  }

  // ── eGovPH SSO: token exchange (stub) ────────────────────────────────
  // Not a hackathon sandbox API we have credentials for — see the const
  // comment above. Frontend never calls this directly; it's scaffolded so
  // a real client_id/secret can be dropped in later without touching the
  // request-handling code.
  if (req.method === "POST" && path === "/api/sso/exchange") {
    if (!SSO_TOKEN_URL || !SSO_CLIENT_SECRET) {
      sendJson(res, 501, {
        error: "not_configured",
        message: "Set EGOVPH_SSO_TOKEN_URL and EGOVPH_SSO_CLIENT_SECRET in server/.env to enable real eGovPH SSO token exchange. Until then, Profile tab's account linking is a local simulation only.",
      });
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const upstream = await fetch(SSO_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SSO_CLIENT_SECRET}` },
        body: JSON.stringify(payload),
      });
      const data = await upstream.json().catch(() => ({}));
      sendJson(res, upstream.status, data);
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  // ── DBM Compass: appropriations/spending lookup (stub) ──────────────
  // Situational — strongest fit is letting an eReport complaint about a
  // delayed/misused project be cross-referenced against real SAAODB/NCA/
  // SARO/LGSF records for credibility. Not wired to a real base URL/key.
  if (req.method === "GET" && path === "/api/dbm-compass/appropriations") {
    if (!DBM_COMPASS_BASE_URL || !DBM_COMPASS_API_KEY) {
      sendJson(res, 501, {
        error: "not_configured",
        message: "Set DBM_COMPASS_BASE_URL and DBM_COMPASS_API_KEY in server/.env to enable real DBM Compass lookups.",
      });
      return;
    }
    try {
      const params = Object.fromEntries(url.searchParams);
      const upstream = await fetch(`${DBM_COMPASS_BASE_URL}/appropriations?${new URLSearchParams(params)}`, {
        headers: { Authorization: `Bearer ${DBM_COMPASS_API_KEY}` },
      });
      const data = await upstream.json().catch(() => ({}));
      sendJson(res, upstream.status, data);
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  // ── eGovPay: checkout session (stub) ─────────────────────────────────
  // Situational — nothing in this prototype currently charges a fee
  // (document requests, permits, etc. are all shown as free/simulated),
  // so there's no real UI flow to attach this to yet.
  if (req.method === "POST" && path === "/api/egovpay/checkout") {
    if (!EGOVPAY_BASE_URL || !EGOVPAY_API_KEY) {
      sendJson(res, 501, {
        error: "not_configured",
        message: "Set EGOVPAY_BASE_URL and EGOVPAY_API_KEY in server/.env to enable real eGovPay checkout sessions.",
      });
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const upstream = await fetch(`${EGOVPAY_BASE_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${EGOVPAY_API_KEY}` },
        body: JSON.stringify(payload),
      });
      const data = await upstream.json().catch(() => ({}));
      sendJson(res, upstream.status, data);
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  // ── eGov AI: document classification (stub) ──────────────────────────
  // Situational — there's no file-upload surface anywhere in this
  // prototype yet (ApplyModal is a self-attestation checklist by design),
  // so there's nothing for this to process until that changes.
  if (req.method === "POST" && path === "/api/egov-ai/classify") {
    if (!EGOV_AI_BASE_URL || !EGOV_AI_API_KEY) {
      sendJson(res, 501, {
        error: "not_configured",
        message: "Set EGOV_AI_BASE_URL and EGOV_AI_API_KEY in server/.env to enable real eGov AI document classification.",
      });
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const upstream = await fetch(`${EGOV_AI_BASE_URL}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${EGOV_AI_API_KEY}` },
        body: JSON.stringify(payload),
      });
      const data = await upstream.json().catch(() => ({}));
      sendJson(res, upstream.status, data);
    } catch (err) {
      sendJson(res, 502, { error: "upstream_unreachable", message: err.message });
    }
    return;
  }

  sendJson(res, 404, { error: "not_found" });
});

server.listen(PORT, () => {
  console.log(`Backend proxy listening on http://localhost:${PORT}`);
  if (!EVERIFY_VERIFY_URL || !EVERIFY_SECRET_KEY) {
    console.log("  (EVERIFY_VERIFY_URL / EVERIFY_SECRET_KEY not set — /api/verify will return 501 until configured in server/.env)");
  }
  if (!ereport.ereportConfigured()) {
    console.log("  (EREPORT_BASE_URL / EREPORT_ACCESS_CODE not set — /api/ereport/* will return 501 until configured in server/.env)");
  }
  if (!emessageConfigured()) {
    console.log("  (EMESSAGE_BASE_URL / EMESSAGE_API_TOKEN not set — SMS confirmations will be skipped)");
  }
  if (!SSO_TOKEN_URL || !SSO_CLIENT_SECRET) {
    console.log("  (EGOVPH_SSO_TOKEN_URL / EGOVPH_SSO_CLIENT_SECRET not set — /api/sso/exchange will return 501; Profile tab account linking stays a local simulation)");
  }
  if (!DBM_COMPASS_BASE_URL || !DBM_COMPASS_API_KEY) {
    console.log("  (DBM_COMPASS_BASE_URL / DBM_COMPASS_API_KEY not set — /api/dbm-compass/* will return 501)");
  }
  if (!EGOVPAY_BASE_URL || !EGOVPAY_API_KEY) {
    console.log("  (EGOVPAY_BASE_URL / EGOVPAY_API_KEY not set — /api/egovpay/* will return 501; no fee-based flow exists yet anyway)");
  }
  if (!EGOV_AI_BASE_URL || !EGOV_AI_API_KEY) {
    console.log("  (EGOV_AI_BASE_URL / EGOV_AI_API_KEY not set — /api/egov-ai/* will return 501; no file-upload flow exists yet anyway)");
  }
});
