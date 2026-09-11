import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { colors, radii } from "@/theme";

const MENU_ITEMS = ["Edit profile", "Payment history", "Help & support", "Terms & privacy"];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { subscription, isActive } = useSubscription(user?.id);
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const phone = user?.user_metadata?.phone as string | undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Profile</Text>

      <View style={styles.profileRow}>
        <Avatar name={fullName} size={56} />
        <View>
          <Text style={styles.name}>{fullName ?? "Nyumba Finder user"}</Text>
          <Text style={styles.phone}>{phone ?? user?.email}</Text>
        </View>
      </View>

      <View style={styles.subCard}>
        <View style={styles.subHeader}>
          {isActive && <View style={styles.liveDot} />}
          <Text style={styles.subStatus}>{isActive ? "Subscription active" : "No active subscription"}</Text>
        </View>
        {isActive && subscription?.expires_at && (
          <Text style={styles.subMeta}>Renews {new Date(subscription.expires_at).toLocaleDateString()}</Text>
        )}
      </View>

      {MENU_ITEMS.map((item) => (
        <TouchableOpacity key={item} style={styles.menuRow}>
          <Text style={styles.menuText}>{item}</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => {
          Alert.alert("Sign out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: signOut }
          ]);
        }}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen, paddingHorizontal: 22, paddingTop: 60 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: colors.inkPrimary, marginBottom: 20 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  name: { fontSize: 17, fontWeight: "800", color: colors.inkPrimary },
  phone: { fontSize: 13, color: colors.inkSecondary, marginTop: 2 },
  subCard: { borderWidth: 1, borderColor: colors.borderCard, borderRadius: radii.card, padding: 16, marginBottom: 20 },
  subHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  subStatus: { fontWeight: "700", color: colors.inkPrimary },
  subMeta: { fontSize: 12, color: colors.inkSecondary, marginTop: 4, marginLeft: 16 },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle
  },
  menuText: { fontSize: 15, color: colors.inkPrimary },
  menuChevron: { fontSize: 18, color: colors.inkTertiary },
  signOutButton: { paddingVertical: 20, alignItems: "center" },
  signOutText: { color: colors.red, fontWeight: "600" }
});
