import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Avatar from "./Avatar";
import { colors } from "@/theme";
import type { Review } from "@/types";

function overallRating(review: Review) {
  const values = [
    review.caretaker_rating,
    review.repairs_rating,
    review.electricity_rating,
    review.water_rating,
    review.rent_fair_rating
  ];
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default function ReviewCard({ review, reviewerName }: { review: Review; reviewerName: string }) {
  const overall = overallRating(review);
  const depositReturned = review.deposit_returned;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={reviewerName} size={32} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{reviewerName}</Text>
          <Text style={styles.subMeta}>
            {review.lived_duration_months ? `Lived ${review.lived_duration_months} mo` : "Former tenant"}
          </Text>
        </View>
        <Text style={styles.stars}>★ {overall.toFixed(1)}</Text>
      </View>

      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

      {depositReturned != null && (
        <View style={[styles.chip, { backgroundColor: depositReturned ? colors.greenTint : colors.redTint }]}>
          <Text style={[styles.chipText, { color: depositReturned ? colors.green : colors.red }]}>
            {depositReturned ? "Deposit returned" : "Deposit not returned in full"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 8
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  headerText: {
    flex: 1
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.inkPrimary
  },
  subMeta: {
    fontSize: 12,
    color: colors.inkTertiary
  },
  stars: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkPrimary
  },
  comment: {
    fontSize: 14,
    color: colors.inkPrimary,
    lineHeight: 20
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700"
  }
});
