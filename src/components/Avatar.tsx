import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

function initialsFrom(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function Avatar({ name, size = 40 }: { name: string | null | undefined; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initialsFrom(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.accentTint,
    alignItems: "center",
    justifyContent: "center"
  },
  text: {
    color: colors.accent,
    fontWeight: "700"
  }
});
