// eReport (eGov citizen complaint/incident reporting) — internal server-side
// client. Mirrors the eVerify pattern: the access_code / bearer token never
// reaches the browser, the frontend only ever talks to our own /api/ereport/*
// routes.
//
// ⚠ UNCONFIRMED ASSUMPTIONS (flagged loudly — see chat writeup / README):
//   1. POST /api/integration/token's response shape isn't documented. We
//      accept token / access_token / data.token, whichever is present.
//   2. How that token is attached to subsequent calls (datasets,
//      submit_complaint) isn't documented either. We default to
//      `Authorization: Bearer <token>` — configurable via
//      EREPORT_AUTH_HEADER_NAME / EREPORT_AUTH_HEADER_PREFIX so this can be
//      fixed from server/.env without a code change if eGov's API expects
//      something else (e.g. a custom X-EReport-Token header).
//   3. Whether the dataset endpoints (report_types/regions/provinces/...)
//      require this token at all, or are public, isn't documented. We send
//      it regardless — harmless if unneeded.
//   4. The OTP flow only gives one URL (/api/integration/verify/request).
//      We POST {email} to request an OTP and POST {email, otp} to the SAME
//      URL to confirm it, per how the two example bodies were given. If
//      eGov actually uses two different endpoints, this will 404/fail on
//      the confirm step.
//   5. The OTP-confirm response's field name for the view token isn't
//      documented. We accept view_token / token / integration_report_view_token.
//   6. No token-expiry/refresh info is documented for either token. The
//      integration token is cached in memory and refreshed after 30 min or
//      on a 401 retry; this interval is a guess.

const TOKEN_TTL_MS = 30 * 60 * 1000;

let cachedToken = null;
let cachedTokenAt = 0;

function config() {
  return {
    baseUrl: process.env.EREPORT_BASE_URL,
    accessCode: process.env.EREPORT_ACCESS_CODE,
    authHeaderName: process.env.EREPORT_AUTH_HEADER_NAME || "Authorization",
    authHeaderPrefix: process.env.EREPORT_AUTH_HEADER_PREFIX ?? "Bearer ",
  };
}

export function ereportConfigured() {
  const { baseUrl, accessCode } = config();
  return Boolean(baseUrl && accessCode);
}

async function fetchToken(force = false) {
  const { baseUrl, accessCode } = config();
  if (!baseUrl || !accessCode) throw new Error("not_configured");

  if (!force && cachedToken && Date.now() - cachedTokenAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const res = await fetch(`${baseUrl}/api/integration/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_code: accessCode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `eReport token request failed (${res.status})`);
  }

  const token = data?.token || data?.access_token || data?.data?.token;
  if (!token) {
    throw new Error("eReport token response had no recognizable token field (tried token / access_token / data.token)");
  }

  cachedToken = token;
  cachedTokenAt = Date.now();
  return token;
}

// GET/POST to an authenticated eReport endpoint, retrying once with a fresh
// token if the first attempt gets a 401 (in case our cached token expired
// server-side before our TTL guess said it would).
async function authedRequest(path, { method = "GET", body } = {}) {
  const { baseUrl, authHeaderName, authHeaderPrefix } = config();

  async function attempt(token) {
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        [authHeaderName]: `${authHeaderPrefix}${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  let token = await fetchToken();
  let res = await attempt(token);
  if (res.status === 401) {
    token = await fetchToken(true);
    res = await attempt(token);
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getDataset(name, searchParams) {
  const qs = searchParams ? `?${new URLSearchParams(searchParams).toString()}` : "";
  return authedRequest(`/api/integration/datasets/${name}${qs}`);
}

export async function submitComplaint(payload) {
  return authedRequest("/api/integration/submit_complaint", { method: "POST", body: payload });
}

export async function requestOtp(email) {
  const { baseUrl } = config();
  const res = await fetch(`${baseUrl}/api/integration/verify/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function verifyOtp(email, otp) {
  const { baseUrl } = config();
  // Assumption #4 above: same URL as requestOtp, distinguished by the extra
  // `otp` field.
  const res = await fetch(`${baseUrl}/api/integration/verify/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json().catch(() => ({}));
  const viewToken = data?.view_token || data?.token || data?.integration_report_view_token;
  return { ok: res.ok, status: res.status, data, viewToken };
}

export async function getReports(viewToken) {
  const { baseUrl } = config();
  const res = await fetch(`${baseUrl}/api/integration/reports`, {
    headers: { "X-EReport-View-Token": viewToken },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getReportByCaseNumber(caseNumber, viewToken) {
  const { baseUrl } = config();
  const res = await fetch(`${baseUrl}/api/integration/reports/${encodeURIComponent(caseNumber)}`, {
    headers: { "X-EReport-View-Token": viewToken },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
