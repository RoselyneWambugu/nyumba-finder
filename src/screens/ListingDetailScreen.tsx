import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Avatar from "@/components/Avatar";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import PlaceholderPhoto from "@/components/PlaceholderPhoto";
import RatingBar from "@/components/RatingBar";
import ReviewCard from "@/components/ReviewCard";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useReviews } from "@/hooks/useReviews";
import { useSavedListings } from "@/hooks/useSavedListings";
import { useSubscription } from "@/hooks/useSubscription";
import { colors, radii } from "@/theme";
import type { ListingContact, ListingWithPhotos } from "@/types";
import type { RootStackParamList } from "@/navigation/RootNavigator";

const { width } = Dimensions.get("window");

const RATING_FIELDS: { key: keyof import("@/types").Review; label: string }[] = [
  { key: "caretaker_rating", label: "Caretaker" },
  { key: "repairs_rating", label: "Repairs" },
  { key: "electricity_rating", label: "Electricity" },
  { key: "water_rating", label: "Water" },
  { key: "rent_fair_rating", label: "Rent fairness" }
];

export default function ListingDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { listingId } = route.params as RootStackParamList["ListingDetail"];
  const { user } = useAuth();

  const [listing, setListing] = useState<ListingWithPhotos | null>(null);
  const [owner, setOwner] = useState<{ full_name: string | null } | null>(null);
  const [contact, setContact] = useState<ListingContact | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  const { reviews } = useReviews(listingId);
  const { savedIds, toggleSave } = useSavedListings(user?.id);
  const { isActive: isSubscribed } = useSubscription(user?.id);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: listingData } = await supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .eq("id", listingId)
        .maybeSingle();
      setListing((listingData as unknown as ListingWithPhotos) ?? null);

      if (listingData) {
        const { data: ownerData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", listingData.owner_id)
          .maybeSingle();
        setOwner(ownerData);
      }

      setContactLoading(true);
      const { data: contactData } = await supabase
        .from("listing_contacts")
        .select("*")
        .eq("listing_id", listingId)
        .maybeSingle();
      setContact(contactData);
      setContactLoading(false);
      setLoading(false);
    }
    load();
  }, [listingId, isSubscribed]);

  if (loading || !listing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const overallAvg = reviews.length
    ? reviews.reduce((sum, r) => {
        const values = RATING_FIELDS.map(({ key }) => r[key] as number);
        return sum + values.reduce((s, v) => s + v, 0) / values.length;
      }, 0) / reviews.length
    : null;

  const barAverages = RATING_FIELDS.map(({ key, label }) => ({
    label,
    value: reviews.length ? reviews.reduce((s, r) => s + (r[key] as number), 0) / reviews.length : 0
  }));

  const depositReturnedPct = (() => {
    const withAnswer = reviews.filter((r) => r.deposit_returned != null);
    if (!withAnswer.length) return null;
    const yes = withAnswer.filter((r) => r.deposit_returned).length;
    return Math.round((yes / withAnswer.length) * 100);
  })();

  const photos = listing.listing_photos ?? [];
  const saved = savedIds.has(listing.id);
  const isOwner = user?.id === listing.owner_id;

  return (
    <ScrollView style={styles.container}>
      <View>
        {photos.length > 0 ? (
          <FlatList
            data={photos}
            keyExtractor={(p) => p.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={() => <PlaceholderPhoto seed={listing.id} height={230} />}
          />
        ) : (
          <PlaceholderPhoto seed={listing.id} height={230} />
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.iconText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.heartButton} onPress={() => toggleSave(listing.id)}>
          <Text style={[styles.iconText, saved && { color: colors.red }]}>{saved ? "♥" : "♡"}</Text>
        </TouchableOpacity>

        {photos.length > 1 && (
          <View style={styles.dots}>
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>
            KES {listing.price_kes.toLocaleString()}
            <Text style={styles.priceUnit}>/mo</Text>
          </Text>
        </View>
        <Text style={styles.subtitle}>{listing.location_text}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{listing.bedrooms === 0 ? "Studio" : listing.bedrooms}</Text>
            <Text style={styles.statLabel}>Bedrooms</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{listing.bathrooms ?? "-"}</Text>
            <Text style={styles.statLabel}>Bathrooms</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {listing.deposit_kes ? `${Math.round(listing.deposit_kes / (listing.price_kes || 1))}mo` : "-"}
            </Text>
            <Text style={styles.statLabel}>Deposit</Text>
          </View>
        </View>

        <View style={styles.availabilityCard}>
          <AvailabilityBadge status={listing.availability_status} />
          <Text style={styles.updatedText}>
            Updated {new Date(listing.updated_at).toLocaleDateString()} by the poster
          </Text>
        </View>

        <View style={styles.postedByRow}>
          <Avatar name={owner?.full_name} size={36} />
          <View style={styles.postedByText}>
            <Text style={styles.postedByLabel}>Posted by</Text>
            <Text style={styles.postedByName}>{owner?.full_name ?? "A tenant"}</Text>
          </View>
          {!isOwner && (
            <TouchableOpacity
              style={styles.tipButton}
              onPress={() =>
                navigation.navigate("SendTip", {
                  listingId: listing.id,
                  posterName: owner?.full_name ?? "the poster"
                })
              }
            >
              <Text style={styles.tipButtonText}>Tip {owner?.full_name?.split(" ")[0] ?? ""}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Tenant ratings{overallAvg != null ? ` · ${overallAvg.toFixed(1)} overall` : ""} ({reviews.length} review
          {reviews.length === 1 ? "" : "s"})
        </Text>
        {barAverages.map((b) => (
          <RatingBar key={b.label} label={b.label} value={b.value} />
        ))}
        {depositReturnedPct != null && (
          <Text style={styles.depositStat}>
            Deposit returned in full: <Text style={styles.depositStatValue}>{depositReturnedPct}%</Text> of reviews
          </Text>
        )}

        {!isOwner && (
          <TouchableOpacity
            style={styles.reviewCta}
            onPress={() => navigation.navigate("WriteReview", { listingId: listing.id, listingTitle: listing.title })}
          >
            <Text style={styles.reviewCtaText}>Write a review</Text>
          </TouchableOpacity>
        )}

        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} reviewerName={review.profiles?.full_name ?? "A tenant"} />
        ))}

        <View style={styles.contactCard}>
          {contactLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : contact ? (
            <>
              <Text style={styles.contactTitle}>Caretaker & agency contact</Text>
              {contact.caretaker_name && (
                <Text style={styles.contactLine}>
                  {contact.caretaker_name} (caretaker) · {contact.caretaker_phone}
                </Text>
              )}
              {contact.agency_name && (
                <Text style={styles.contactLine}>
                  {contact.agency_name} (agency) · {contact.agency_phone}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.contactTitle}>Unlock caretaker & agency contact</Text>
              <Pressable
                style={styles.unlockButton}
                onPress={() => navigation.navigate("Tabs", { screen: "Subscription" })}
              >
                <Text style={styles.unlockButtonText}>Subscribe to unlock — KES 250/mo</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgScreen },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  heartButton: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(33,25,20,0.6)",
    alignItems: "center",
    justifyContent: "center"
  },
  iconText: { fontSize: 18, color: colors.inkPrimary },
  dots: { position: "absolute", bottom: 12, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.6)" },
  dotActive: { backgroundColor: "#fff", width: 16 },
  body: { padding: 22 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: "800", color: colors.inkPrimary },
  price: { fontSize: 20, fontWeight: "800", color: colors.accent },
  priceUnit: { fontSize: 13, fontWeight: "600", color: colors.inkSecondary },
  subtitle: { fontSize: 14, color: colors.inkSecondary, marginTop: 4, marginBottom: 16 },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radii.card,
    paddingVertical: 14,
    alignItems: "center"
  },
  statValue: { fontSize: 17, fontWeight: "800", color: colors.inkPrimary },
  statLabel: { fontSize: 12, color: colors.inkSecondary, marginTop: 2 },
  availabilityCard: {
    backgroundColor: colors.greenTint,
    borderRadius: radii.card,
    padding: 16,
    gap: 6,
    marginBottom: 16
  },
  updatedText: { fontSize: 12, color: colors.inkSecondary, marginLeft: 16 },
  postedByRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radii.card,
    padding: 12,
    marginBottom: 22
  },
  postedByText: { flex: 1 },
  postedByLabel: { fontSize: 11, color: colors.inkTertiary },
  postedByName: { fontSize: 14, fontWeight: "700", color: colors.inkPrimary },
  tipButton: { backgroundColor: colors.accentTint, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill },
  tipButtonText: { color: colors.accent, fontWeight: "700", fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.inkPrimary, marginBottom: 14 },
  depositStat: { fontSize: 13, color: colors.inkSecondary, marginTop: 4, marginBottom: 18 },
  depositStatValue: { fontWeight: "800", color: colors.inkPrimary },
  reviewCta: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.card,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 4
  },
  reviewCtaText: { color: colors.accent, fontWeight: "700" },
  contactCard: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.card,
    padding: 20,
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accentTint
  },
  lockIcon: { fontSize: 22 },
  contactTitle: { fontSize: 15, fontWeight: "800", color: colors.inkPrimary, textAlign: "center" },
  contactLine: { fontSize: 14, color: colors.inkPrimary, alignSelf: "flex-start" },
  unlockButton: { backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 12, marginTop: 6 },
  unlockButtonText: { color: "#fff", fontWeight: "700" }
});
