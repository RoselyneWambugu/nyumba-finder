import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useReviews } from "@/hooks/useReviews";
import { colors, radii } from "@/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";

const RATING_ROWS: { key: "caretaker_rating" | "repairs_rating" | "electricity_rating" | "water_rating" | "rent_fair_rating"; label: string }[] = [
  { key: "caretaker_rating", label: "Caretaker" },
  { key: "repairs_rating", label: "Repairs" },
  { key: "electricity_rating", label: "Electricity" },
  { key: "water_rating", label: "Water" },
  { key: "rent_fair_rating", label: "Rent fairness" }
];

function RatingSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.sliderRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} style={styles.sliderDotWrap} onPress={() => onChange(n)}>
          <View style={[styles.sliderDot, n <= value && styles.sliderDotActive]} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function WriteReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { listingId, listingTitle } = route.params as RootStackParamList["WriteReview"];
  const { submitReview } = useReviews(listingId);

  const [ratings, setRatings] = useState({
    caretaker_rating: 3,
    repairs_rating: 3,
    electricity_rating: 3,
    water_rating: 3,
    rent_fair_rating: 3
  });
  const [depositReturned, setDepositReturned] = useState<boolean | null>(null);
  const [monthsLived, setMonthsLived] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitReview({
        ...ratings,
        deposit_returned: depositReturned,
        lived_duration_months: monthsLived ? Number(monthsLived) : null,
        comment: comment.trim() || null
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't submit review", err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.context}>Reviewing: {listingTitle}</Text>

      {RATING_ROWS.map(({ key, label }) => (
        <View key={key} style={styles.ratingBlock}>
          <View style={styles.ratingHeader}>
            <Text style={styles.ratingLabel}>{label}</Text>
            <Text style={styles.ratingValue}>{ratings[key]}/5</Text>
          </View>
          <RatingSlider value={ratings[key]} onChange={(v) => setRatings((r) => ({ ...r, [key]: v }))} />
        </View>
      ))}

      <Text style={styles.label}>Was your deposit returned?</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, depositReturned === true && styles.toggleButtonActive]}
          onPress={() => setDepositReturned(true)}
        >
          <Text style={[styles.toggleText, depositReturned === true && styles.toggleTextActive]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, depositReturned === false && styles.toggleButtonActive]}
          onPress={() => setDepositReturned(false)}
        >
          <Text style={[styles.toggleText, depositReturned === false && styles.toggleTextActive]}>No</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Months lived there</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={monthsLived} onChangeText={setMonthsLived} placeholder="e.g. 8" />

      <Text style={styles.label}>Comment</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={comment}
        onChangeText={setComment}
        placeholder="Share details future tenants would want to know…"
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitButtonText}>{submitting ? "Submitting…" : "Submit review"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen },
  content: { padding: 22, paddingBottom: 60 },
  context: { fontSize: 13, color: colors.inkSecondary, marginBottom: 20 },
  ratingBlock: { marginBottom: 18 },
  ratingHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  ratingLabel: { fontSize: 14, fontWeight: "700", color: colors.inkPrimary },
  ratingValue: { fontSize: 13, fontWeight: "700", color: colors.accent },
  sliderRow: { flexDirection: "row", gap: 8 },
  sliderDotWrap: { flex: 1, paddingVertical: 6 },
  sliderDot: { height: 10, borderRadius: 5, backgroundColor: colors.grayTint },
  sliderDotActive: { backgroundColor: colors.accent },
  label: { fontSize: 12, fontWeight: "700", color: colors.inkSecondary, marginTop: 16, marginBottom: 8 },
  toggleRow: { flexDirection: "row", gap: 10 },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  toggleButtonActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  toggleText: { fontWeight: "700", color: colors.inkPrimary },
  toggleTextActive: { color: "#fff" },
  input: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  textarea: { height: 100, textAlignVertical: "top" },
  submitButton: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 28 },
  submitButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 }
});
