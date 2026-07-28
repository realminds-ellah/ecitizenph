// eMessage (SMS) — internal server-side helper only.
//
// This is deliberately NOT exposed as a public "/api/sms/push" route that
// the browser can call directly: doing so would let anyone using the app
// trigger arbitrary SMS sends (and API spend) to arbitrary numbers through
// our credentials. Instead, sendSms() is called from specific backend
// events — e.g. after a successful eVerify response in index.mjs — and is
// meant to be reused the same way once the eReport API is integrated
// (e.g. notifying a citizen when eReport reports a status change on a
// government service application/tracker item).

// Read lazily (not at module top-level) so this still works regardless of
// import order relative to index.mjs's server/.env loader.
export function emessageConfigured() {
  return Boolean(process.env.EMESSAGE_BASE_URL && process.env.EMESSAGE_API_TOKEN);
}

/**
 * @param {string} number E.164 mobile number, e.g. "+639171234567"
 * @param {string} message
 * @returns {Promise<{ ok: boolean; status?: number; message?: string }>}
 */
export async function sendSms(number, message) {
  const baseUrl = process.env.EMESSAGE_BASE_URL;
  const apiToken = process.env.EMESSAGE_API_TOKEN;

  if (!baseUrl || !apiToken) {
    return { ok: false, message: "eMessage not configured (EMESSAGE_BASE_URL / EMESSAGE_API_TOKEN unset)." };
  }
  if (!number || !message) {
    return { ok: false, message: "sendSms requires both number and message." };
  }

  try {
    const res = await fetch(`${baseUrl}/messaging/v1/sms/push`, {
      method: "POST",
      headers: {
        "X-EMESSAGE-Auth": apiToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number, message }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, status: res.status, message: body || `eMessage returned ${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}
