import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Stand-in for the design's diagonal-stripe placeholder (no real photography yet).
// Picks a stable pastel tone per listing so cards read as visually distinct, same as the mock.
const PALETTE = ["#D8CBB8", "#BFE0D8", "#C9D6C2", "#E4D3B8", "#C7D3E0"];

function hashToIndex(seed: string, mod: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % mod;
}

export default function PlaceholderPhoto({
  seed,
  height,
  label = "photo coming soon"
}: {
  seed: string;
  height: number;
  label?: string;
}) {
  const tone = PALETTE[hashToIndex(seed, PALETTE.length)];
  return (
    <View style={[styles.container, { height, backgroundColor: tone }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "rgba(33,25,20,0.45)",
    textTransform: "lowercase"
  }
});
