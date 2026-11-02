import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Avatar from "@/components/Avatar";
import { startMpesaPayment, pollPaymentStatus } from "@/lib/mpesa";
import { colors, radii } from "@/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";

const PRESETS = [50, 100, 200];

export default function SendTipScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listingId, posterName } = route.params as RootStackParamList["SendTip"];

  const [amount, setAmount] = useState<number>(PRESETS[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "timed_out" | "failed">("idle");
  // Kept so "Check again" can re-poll the same transaction after a timeout,
  // without starting a brand new STK push.
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(null);

  const activeAmount = customAmount ? Number(customAmount) : amount;

  async function handleSend() {
    if (!phone.trim()) {
      Alert.alert("Missing phone number", "Enter the M-Pesa phone number to send the tip from.");
      return;
    }
    if (!activeAmount || Number.isNaN(activeAmount) || activeAmount <= 0) {
      Alert.alert("Invalid amount", "Enter a valid tip amount.");
      return;
    }
    if (status === "timed_out") {
      Alert.alert(
        "Still waiting on the last tip",
        "We haven't heard back from M-Pesa yet, so it may still succeed. Sending again now could charge you twice. Tap \"Check again\" instead, or confirm you want to send again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Send again anyway", style: "destructive", onPress: () => void sendTip() }
        ]
      );
      return;
    }
    await sendTip();
  }

  async function sendTip() {
    setStatus("sending");
    try {
      const { checkoutRequestId } = await startMpesaPayment({
        purpose: "tip",
        phone,
        amount: activeAmount,
        listingId
      });
      setPendingCheckoutId(checkoutRequestId);
      setStatus("sent");

      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const result = await pollPaymentStatus(checkoutRequestId);
        if (result === "success") {
          Alert.alert("Tip sent!", `Thanks — your KES ${activeAmount} tip is on its way to ${posterName}.`);
          navigation.goBack();
          return;
        }
        if (result === "failed") {
          setStatus("failed");
          return;
        }
      }
      // M-Pesa hasn't actually told us this failed -- it may still resolve.
      setStatus("timed_out");
    } catch (err) {
      setStatus("failed");
      Alert.alert("Couldn't send tip", err instanceof Error ? err.message : String(err));
    }
  }

  async function checkAgain() {
    if (!pendingCheckoutId) return;
    const result = await pollPaymentStatus(pendingCheckoutId);
    if (result === "success") {
      Alert.alert("Tip sent!", `Thanks — your KES ${activeAmount} tip is on its way to ${posterName}.`);
      navigation.goBack();
    } else if (result === "failed") {
      setStatus("failed");
    } else {
      Alert.alert("Still processing", "M-Pesa hasn't confirmed this payment yet. Check again in a moment.");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.posterCard}>
        <Avatar name={posterName} size={40} />
        <View style={styles.posterText}>
          <Text style={styles.posterName}>{posterName}</Text>
          <Text style={styles.posterSub}>Posted the listing that got you in</Text>
        </View>
      </View>

      <Text style={styles.explainer}>
        A small thank-you for the honest post that helped you find your place. Fully optional — 100% goes to{" "}
        {posterName}, no fees.
      </Text>

      <Text style={styles.label}>Choose an amount</Text>
      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.presetPill, amount === p && !customAmount && styles.presetPillActive]}
            onPress={() => {
              setAmount(p);
              setCustomAmount("");
            }}
          >
            <Text style={[styles.presetText, amount === p && !customAmount && styles.presetTextActive]}>
              KES {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Or enter a custom amount"
        keyboardType="numeric"
        value={customAmount}
        onChangeText={setCustomAmount}
      />

      <Text style={styles.label}>M-Pesa phone number</Text>
      <TextInput style={styles.input} placeholder="0712 345 678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      <TouchableOpacity
        style={styles.sendButton}
        onPress={handleSend}
        disabled={status === "sending" || status === "sent"}
      >
        <Text style={styles.sendButtonText}>
          {status === "sending" ? "Sending…" : status === "sent" ? "Confirm on your phone…" : `Send KES ${activeAmount || 0} tip`}
        </Text>
      </TouchableOpacity>
      {status === "failed" && <Text style={styles.failedText}>Payment didn't go through — try again.</Text>}
      {status === "timed_out" && (
        <View>
          <Text style={styles.timedOutText}>
            Still waiting to hear back from M-Pesa. This can take a minute — please don't send again yet.
          </Text>
          <TouchableOpacity style={styles.checkAgainButton} onPress={checkAgain}>
            <Text style={styles.checkAgainButtonText}>Check again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen },
  content: { padding: 22, paddingTop: 24, gap: 4 },
  posterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radii.card,
    padding: 14,
    marginBottom: 18
  },
  posterText: { flex: 1 },
  posterName: { fontWeight: "800", color: colors.inkPrimary, fontSize: 15 },
  posterSub: { color: colors.inkSecondary, fontSize: 12 },
  explainer: { color: colors.inkSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: "800", color: colors.inkSecondary, letterSpacing: 0.4, marginBottom: 8, marginTop: 10 },
  presetRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  presetPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center"
  },
  presetPillActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  presetText: { fontWeight: "700", color: colors.inkPrimary },
  presetTextActive: { color: colors.accent },
  input: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15
  },
  sendButton: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 26 },
  sendButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  failedText: { color: colors.red, textAlign: "center", marginTop: 12 },
  timedOutText: { color: colors.inkSecondary, fontWeight: "600", lineHeight: 19, textAlign: "center", marginTop: 12 },
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
