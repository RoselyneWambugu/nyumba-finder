import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PlaceholderPhoto from "@/components/PlaceholderPhoto";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/hooks/useAuth";
import { colors, radii } from "@/theme";
import type { ListingWithPhotos } from "@/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MyListingsScreen() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithPhotos[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("listings")
      .select("*, listing_photos(*)")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });
    setListings((data as unknown as ListingWithPhotos[]) ?? []);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function setStatus(listingId: string, status: "available" | "occupied") {
    if (!user) return;
    setUpdatingId(listingId);
    // Optimistic flip: the whole point of this screen is a single, immediate tap.
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, availability_status: status, updated_at: new Date().toISOString() } : l))
    );
    await supabase.from("availability_updates").insert({ listing_id: listingId, status, updated_by: user.id });
    setUpdatingId(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My listings</Text>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>You haven't posted a listing yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.listing_photos?.[0]?.url ? (
              <Image source={{ uri: item.listing_photos[0].url }} style={styles.photo} />
            ) : (
              <PlaceholderPhoto seed={item.id} height={140} />
            )}
            <View style={styles.body}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>Last updated {timeAgo(item.updated_at)}</Text>
              <View style={styles.segment}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    item.availability_status !== "occupied" && styles.segmentButtonActive
                  ]}
                  disabled={updatingId === item.id}
                  onPress={() => setStatus(item.id, "available")}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      item.availability_status !== "occupied" && styles.segmentTextActive
                    ]}
                  >
                    Still empty
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, item.availability_status === "occupied" && styles.segmentButtonActive]}
                  disabled={updatingId === item.id}
                  onPress={() => setStatus(item.id, "occupied")}
                >
                  <Text
                    style={[styles.segmentText, item.availability_status === "occupied" && styles.segmentTextActive]}
                  >
                    Now occupied
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen, paddingHorizontal: 22, paddingTop: 60 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: colors.inkPrimary, marginBottom: 18 },
  list: { paddingBottom: 24 },
  empty: { textAlign: "center", color: colors.inkTertiary, marginTop: 40 },
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderCard,
    marginBottom: 16
  },
  photo: { width: "100%", height: 140 },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: "800", color: colors.inkPrimary },
  meta: { fontSize: 12, color: colors.inkTertiary, marginTop: 2, marginBottom: 12 },
  segment: { flexDirection: "row", borderRadius: 12, backgroundColor: colors.grayTint, padding: 4, gap: 4 },
  segmentButton: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center" },
  segmentButtonActive: { backgroundColor: colors.accent },
  segmentText: { fontWeight: "700", color: colors.inkSecondary, fontSize: 13 },
  segmentTextActive: { color: "#fff" }
});
