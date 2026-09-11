import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

export default function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(5, value)) / 5;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.value}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  label: {
    width: 90,
    fontSize: 13,
    color: colors.inkSecondary
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grayTint,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 4
  },
  value: {
    width: 28,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: colors.inkPrimary
  }
});
