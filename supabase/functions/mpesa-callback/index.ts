// Public webhook Safaricom calls with the STK push result. Not authenticated by
// Supabase auth (Daraja can't send a user JWT), and — critically — the request
// body itself is untrusted: anyone who learns a checkoutRequestId (the user who
// started that exact payment already knows their own) could POST a forged
// "success" body here. So the incoming payload is only ever used to find WHICH
// transaction to check; the actual success/failure decision always comes from
// an independent server-to-server query back to Safaricom using our own
// credentials, which an attacker cannot fake.
import { createClient } from "jsr:@supabase/supabase-js@2";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const MPESA_ENV = Deno.env.get("MPESA_ENV") ?? "sandbox";
const DARAJA_BASE = MPESA_ENV === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

async function getAccessToken() {
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")!;
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")!;
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);

  const res = await fetch(`${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  if (!res.ok) throw new Error(`Daraja auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

function timestampNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Independently asks Safaricom "what really happened to this checkout", instead
// of trusting the webhook body. Returns null if Safaricom itself couldn't say
// yet (still pending) so the caller can leave the transaction pending.
async function queryStkStatus(checkoutRequestId: string): Promise<{ success: boolean } | null> {
  const shortcode = Deno.env.get("MPESA_SHORTCODE")!;
  const passkey = Deno.env.get("MPESA_PASSKEY")!;
  const timestamp = timestampNow();
  const password = btoa(`${shortcode}${passkey}${timestamp}`);
  const accessToken = await getAccessToken();

  const res = await fetch(`${DARAJA_BASE}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    })
  });
  const data = await res.json();

  // 1032 = "request cancelled by user", 1037 = "timeout" -- genuine failures.
  // 4999 / non-numeric ResultCode from the query itself usually means Safaricom
  // hasn't got a final result yet; treat that as "not resolved" rather than fail.
  if (data.ResultCode === "0" || data.ResultCode === 0) return { success: true };
  if (data.ResultCode == null || data.errorCode) return null;
  return { success: false };
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const stkCallback = payload?.Body?.stkCallback;
    if (!stkCallback) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Ignored: no stkCallback" }));
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: transaction, error: fetchError } = await supabase
      .from("mpesa_transactions")
      .select("*")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();

    if (fetchError || !transaction) {
      console.error("Unknown checkout_request_id in callback", checkoutRequestId);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }));
    }

    // Already resolved (e.g. Safaricom retried the callback, or someone is
    // replaying/spamming this endpoint) -- nothing left to do.
    if (transaction.status !== "pending") {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }));
    }

    const verified = await queryStkStatus(checkoutRequestId);
    if (verified === null) {
      // Safaricom itself hasn't confirmed a final result yet -- leave pending
      // and wait for a later callback or query rather than guessing.
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }));
    }

    const newStatus = verified.success ? "success" : "failed";

    // The receipt number for display purposes only comes via the callback's
    // own metadata (the query endpoint doesn't return it) -- safe to read here
    // because the success/failure decision above never depended on this payload.
    const metadata: Array<{ Name: string; Value: unknown }> = stkCallback.CallbackMetadata?.Item ?? [];
    const receiptNumber = metadata.find((m) => m.Name === "MpesaReceiptNumber")?.Value as
      | string
      | undefined;

    await supabase
      .from("mpesa_transactions")
      .update({
        status: newStatus,
        receipt_number: verified.success ? receiptNumber ?? null : null,
        raw_callback: payload
      })
      .eq("id", transaction.id);

    if (newStatus === "success" && transaction.purpose === "subscription") {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);
      await supabase.from("subscriptions").insert({
        user_id: transaction.user_id,
        status: "active",
        plan_code: "basic_250",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      });
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }));
  } catch (err) {
    console.error(err);
    // Daraja retries on non-2xx, so still ack to avoid a retry storm on a bug we've logged.
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }));
  }
});
