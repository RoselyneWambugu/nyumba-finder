import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { colors, radii } from "@/theme";

type Mode = "signup" | "login";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signup");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn } = useAuth();

  async function handleSubmit() {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter your email and password to continue.");
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      Alert.alert("Missing info", "Enter your full name to continue.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const fullPhone = phone.trim() ? `254${phone.replace(/\D/g, "").replace(/^0+/, "")}` : "";
        const result = await signUp(email.trim(), password, fullName.trim(), fullPhone);
        if (!result.session) {
          // Email confirmation is on for this project, so no session comes back yet.
          Alert.alert(
            "Check your email",
            "We've sent a confirmation link to your email. Confirm it, then log in below."
          );
          setMode("login");
        }
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      Alert.alert("Something went wrong", err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>Nyumba Finder</Text>
        <Text style={styles.tagline}>Real reviews from real tenants.</Text>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentTab, mode === "signup" && styles.segmentTabActive]}
            onPress={() => setMode("signup")}
          >
            <Text style={[styles.segmentText, mode === "signup" && styles.segmentTextActive]}>Sign up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, mode === "login" && styles.segmentTabActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>Log in</Text>
          </TouchableOpacity>
        </View>

        {mode === "signup" && (
          <>
            <Text style={styles.label}>Full name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Wanjiku Kamau" />

            <Text style={styles.label}>Phone number</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phonePrefix}>+254</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="712 345 678"
                keyboardType="phone-pad"
              />
            </View>
          </>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.primaryButtonText}>
            {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === "signup" ? "login" : "signup")}>
          <Text style={styles.footerLink}>
            {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bgScreen },
  container: { padding: 24, paddingTop: 72, gap: 4 },
  logo: { fontSize: 24, fontWeight: "800", color: colors.inkPrimary, textAlign: "center" },
  tagline: { fontSize: 14, color: colors.inkSecondary, textAlign: "center", marginBottom: 28 },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.grayTint,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: 20
  },
  segmentTab: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: "center" },
  segmentTabActive: { backgroundColor: colors.accent },
  segmentText: { fontWeight: "700", color: colors.inkSecondary },
  segmentTextActive: { color: "#fff" },
  label: { fontSize: 12, fontWeight: "700", color: colors.inkSecondary, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  phonePrefix: {
    backgroundColor: colors.grayTint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: "700",
    color: colors.inkPrimary
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  footerLink: { textAlign: "center", color: colors.accent, marginTop: 16, fontWeight: "600" }
});
