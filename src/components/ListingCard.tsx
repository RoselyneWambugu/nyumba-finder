import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AvailabilityBadge from "./AvailabilityBadge";
import PlaceholderPhoto from "./PlaceholderPhoto";
import { colors, radii } from "@/theme";
import type { ListingWithPhotos } from "@/types";

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export default function ListingCard({
  listing,
  saved,
  onPress,
  onToggleSave
}: {
  listing: ListingWithPhotos;
  saved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}) {
  const cover = listing.listing_photos?.[0]?.url;
  const isNew = Date.now() - new Date(listing.created_at).getTime() < NEW_WINDOW_MS;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} />
        ) : (
          <PlaceholderPhoto seed={listing.id} height={130} />
        )}

        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>
            KES {Math.round(listing.price_kes / 1000)}k/mo
          </Text>
        </View>

        <Pressable style={styles.heartButton} onPress={onToggleSave} hitSlop={8}>
          <Text style={[styles.heartIcon, saved && styles.heartIconActive]}>{saved ? "♥" : "♡"}</Text>
        </Pressable>

        <View style={styles.availabilityOverlay}>
          <AvailabilityBadge status={listing.availability_status} size="sm" />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {listing.location_text} · {listing.bedrooms === 0 ? "Bedsitter" : `${listing.bedrooms} bed`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radii.card,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderCard
  },
  image: {
    width: "100%",
    height: 130
  },
  newBadge: {
    position: "absolute",
    top: 12,
    left: -1,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  priceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(33,25,20,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999
  },
  priceBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13
  },
  heartButton: {
    position: "absolute",
    top: 46,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(33,25,20,0.55)",
    alignItems: "center",
    justifyContent: "center"
  },
  heartIcon: {
    color: "#fff",
    fontSize: 15
  },
  heartIconActive: {
    color: colors.red
  },
  availabilityOverlay: {
    position: "absolute",
    left: 12,
    bottom: 12
  },
  body: {
    padding: 14,
    gap: 4
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.inkPrimary
  },
  meta: {
    fontSize: 13,
    color: colors.inkSecondary
  }
});
