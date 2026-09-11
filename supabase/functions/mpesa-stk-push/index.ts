// Initiates a Safaricom Daraja STK push for either the KES 250/month subscription
// or a one-off tip to a listing's poster. Called by the app via supabase.functions.invoke.
import { createClient } from "jsr:@supabase/supabase-js@2";

const MPESA_ENV = Deno.env.get("MPESA_ENV") ?? "sandbox";
const DARAJA_BASE = MPESA_ENV === "production"
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

const SUBSCRIPTION_AMOUNT_KES = 250;

interface RequestBody {
  purpose: "subscription" | "tip";
  phone: string;
  amount?: number;
  listingId?: string;
  recipientId?: string;
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

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

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    const user = userData.user;

    const body = (await req.json()) as RequestBody;
    const phone = normalizePhone(body.phone);
    const amount = body.purpose === "subscription" ? SUBSCRIPTION_AMOUNT_KES : Number(body.amount);

    if (!phone || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid phone or amount" }), { status: 400 });
    }
    if (body.purpose === "tip" && !body.listingId) {
      return new Response(JSON.stringify({ error: "listingId required for a tip" }), { status: 400 });
    }

    const shortcode = Deno.env.get("MPESA_SHORTCODE")!;
    const passkey = Deno.env.get("MPESA_PASSKEY")!;
    const timestamp = timestampNow();
    const password = btoa(`${shortcode}${passkey}${timestamp}`);
    const accessToken = await getAccessToken();

    const stkRes = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: Deno.env.get("MPESA_CALLBACK_URL")!,
        AccountReference: body.purpose === "subscription" ? "NyumbaFinderPlan" : "NyumbaFinderTip",
        TransactionDesc: body.purpose === "subscription" ? "Nyumba Finder monthly plan" : "Tip to poster"
      })
    });

    const stkData = await stkRes.json();
    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      return new Response(JSON.stringify({ error: stkData.errorMessage ?? "STK push failed" }), {
        status: 502
      });
    }

    let recipientId = body.recipientId ?? null;
    if (body.purpose === "tip" && !recipientId && body.listingId) {
      const { data: listing } = await supabase
        .from("listings")
        .select("owner_id")
        .eq("id", body.listingId)
        .maybeSingle();
      recipientId = listing?.owner_id ?? null;
    }

    const { error: insertError } = await supabase.from("mpesa_transactions").insert({
      user_id: user.id,
      purpose: body.purpose,
      amount_kes: amount,
      phone,
      status: "pending",
      checkout_request_id: stkData.CheckoutRequestID,
      merchant_request_id: stkData.MerchantRequestID,
      listing_id: body.listingId ?? null,
      recipient_id: recipientId
    });
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        checkoutRequestId: stkData.CheckoutRequestID,
        merchantRequestId: stkData.MerchantRequestID
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error initiating M-Pesa payment" }), {
      status: 500
    });
  }
});
