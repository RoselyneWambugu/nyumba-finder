import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { startMpesaPayment, pollPaymentStatus } from "@/lib/mpesa";
import { colors, radii } from "@/theme";

type PayState = "idle" | "stk_sent" | "awaiting_confirmation" | "active" | "timed_out" | "failed";

const STEPS: { key: PayState; label: string }[] = [
  { key: "stk_sent", label: "STK push sent" },
  { key: "awaiting_confirmation", label: "Confirm on your phone" },
  { key: "active", label: "Subscription active" }
];

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const { subscription, isActive, refresh } = useSubscription(user?.id);
  const [phone, setPhone] = useState("");
  const [payState, setPayState] = useState<PayState>("idle");
  // Kept so "Check again" can re-poll the same transaction after a timeout,
  // without starting a brand new STK push.
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(null);

  async function handlePay() {
    if (!phone.trim()) {
      Alert.alert("Missing phone number", "Enter your M-Pesa phone number to continue.");
      return;
    }
    if (payState === "timed_out") {
      Alert.alert(
        "Still waiting on the last payment",
        "We haven't heard back from M-Pesa yet, so it may still succeed. Starting a new payment now could charge you twice. Tap \"Check again\" instead, or confirm you want to pay again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Pay again anyway", style: "destructive", onPress: () => void sendPayment() }
        ]
      );
      return;
    }
    await sendPayment();
  }

  async function sendPayment() {
    setPayState("stk_sent");
    try {
      const { checkoutRequestId } = await startMpesaPayment({ purpose: "subscription", phone });
      setPendingCheckoutId(checkoutRequestId);
      setPayState("awaiting_confirmation");

      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const result = await pollPaymentStatus(checkoutRequestId);
        if (result === "success") {
          setPayState("active");
          await refresh();
          return;
        }
        if (result === "failed") {
          setPayState("failed");
          return;
        }
      }
      // M-Pesa hasn't actually told us this failed -- it may still resolve.
      // Showing "failed" here would invite a retry that double-charges.
      setPayState("timed_out");
    } catch (err) {
      setPayState("failed");
      Alert.alert("Payment failed", err instanceof Error ? err.message : String(err));
    }
  }

  async function checkAgain() {
    if (!pendingCheckoutId) return;
    const result = await pollPaymentStatus(pendingCheckoutId);
    if (result === "success") {
      setPayState("active");
      await refresh();
    } else if (result === "failed") {
      setPayState("failed");
    } else {
      Alert.alert("Still processing", "M-Pesa hasn't confirmed this payment yet. Check again in a moment.");
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.key === payState);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Subscription</Text>

      <View style={styles.planCard}>
        <Text style={styles.planEyebrow}>NYUMBA FINDER PLAN</Text>
        <Text style={styles.planPrice}>
          KES 250<Text style={styles.planPriceUnit}>/month</Text>
        </Text>
        <Text style={styles.planBullet}>— Caretaker & agency numbers on every listing</Text>
        <Text style={styles.planBullet}>— Cancel anytime</Text>
        <Text style={styles.planBullet}>— Supports tenants who post honestly</Text>
      </View>

      {isActive && subscription?.expires_at && (
        <View style={styles.activeBanner}>
          <View style={styles.liveDot} />
          <Text style={styles.activeBannerText}>
            Active — renews {new Date(subscription.expires_at).toLocaleDateString()}
          </Text>
        </View>
      )}

      <Text style={styles.label}>M-Pesa phone number</Text>
      <TextInput style={styles.input} placeholder="0712 345 678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePay}
        disabled={payState === "stk_sent" || payState === "awaiting_confirmation"}
      >
        <Text style={styles.payButtonText}>Pay with M-Pesa</Text>
      </TouchableOpacity>

      {payState !== "idle" && (
        <View style={styles.statusList}>
          {STEPS.map((step, i) => (
            <View key={step.key} style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  i <= stepIndex && payState !== "failed" && payState !== "timed_out" && styles.statusDotDone
                ]}
              />
              <Text style={styles.statusLabel}>{step.label}</Text>
            </View>
          ))}
          {payState === "failed" && <Text style={styles.failedText}>Payment didn't complete — try again.</Text>}
          {payState === "timed_out" && (
            <View>
              <Text style={styles.timedOutText}>
                Still waiting to hear back from M-Pesa. This can take a minute — please don't pay again yet.
              </Text>
              <TouchableOpacity style={styles.checkAgainButton} onPress={checkAgain}>
                <Text style={styles.checkAgainButtonText}>Check again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen },
  content: { padding: 22, paddingTop: 60, paddingBottom: 60 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.inkPrimary, marginBottom: 20 },
  planCard: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
    borderRadius: radii.card,
    padding: 20,
    marginBottom: 20,
    gap: 6
  },
  planEyebrow: { fontSize: 11, fontWeight: "800", color: colors.accent, letterSpacing: 0.6 },
  planPrice: { fontSize: 30, fontWeight: "800", color: colors.inkPrimary, marginBottom: 8 },
  planPriceUnit: { fontSize: 15, fontWeight: "600", color: colors.inkSecondary },
  planBullet: { fontSize: 14, color: colors.inkPrimary },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.greenTint,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  activeBannerText: { color: colors.green, fontWeight: "700", fontSize: 13 },
  label: { fontSize: 11, fontWeight: "800", color: colors.inkSecondary, letterSpacing: 0.4, marginBottom: 8 },
  input: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 20
  },
  payButton: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  payButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  statusList: { marginTop: 24, gap: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.grayTint },
  statusDotDone: { backgroundColor: colors.green },
  statusLabel: { fontSize: 14, color: colors.inkPrimary, fontWeight: "600" },
  failedText: { color: colors.red, fontWeight: "600" },
  timedOutText: { color: colors.inkSecondary, fontWeight: "600", lineHeight: 19 },
  checkAgainButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  checkAgainButtonText: { color: colors.accent, fontWeight: "700" }
});
