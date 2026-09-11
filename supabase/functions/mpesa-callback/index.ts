// Public webhook Safaricom calls with the STK push result. Not authenticated by
// Supabase auth (Daraja can't send a user JWT) — trust boundary is the callback
// URL itself being unguessable plus matching against a checkout_request_id we
// already created via mpesa-stk-push.
import { createClient } from "jsr:@supabase/supabase-js@2";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const stkCallback = payload?.Body?.stkCallback;
    if (!stkCallback) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Ignored: no stkCallback" }));
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID as string;
    const resultCode = stkCallback.ResultCode as number;
    const metadata: Array<{ Name: string; Value: unknown }> = stkCallback.CallbackMetadata?.Item ?? [];
    const receiptNumber = metadata.find((m) => m.Name === "MpesaReceiptNumber")?.Value as
      | string
      | undefined;

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

    const newStatus = resultCode === 0 ? "success" : "failed";

    await supabase
      .from("mpesa_transactions")
      .update({
        status: newStatus,
        receipt_number: receiptNumber ?? null,
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
