import { supabase } from "@/config/supabase";

interface StkPushResult {
  checkoutRequestId: string;
  merchantRequestId: string;
}

// The app never talks to Daraja directly — the consumer secret lives only in the
// mpesa-stk-push edge function's environment. This just kicks off the STK push and
// records a pending row the mpesa-callback function will later resolve.
export async function startMpesaPayment(input: {
  purpose: "subscription" | "tip";
  phone: string;
  amount?: number;
  listingId?: string;
  recipientId?: string;
}): Promise<StkPushResult> {
  const { data, error } = await supabase.functions.invoke("mpesa-stk-push", { body: input });
  if (error) throw error;
  return data as StkPushResult;
}

export type MpesaTransactionStatus = "pending" | "success" | "failed";

export async function pollPaymentStatus(checkoutRequestId: string): Promise<MpesaTransactionStatus> {
  const { data, error } = await supabase
    .from("mpesa_transactions")
    .select("status")
    .eq("checkout_request_id", checkoutRequestId)
    .maybeSingle();
  if (error) throw error;
  return (data?.status as MpesaTransactionStatus) ?? "pending";
}
