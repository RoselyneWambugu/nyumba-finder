import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { availabilityColors, colors } from "@/theme";
import type { AvailabilityStatus } from "@/types";

// Mirrors the design's `@keyframes livepulse` — a persistent, looping pulse on the
// status dot to keep reinforcing that availability is live data, not a static label.
function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.8, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true })
        ])
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={styles.dotWrap}>
      <Animated.View
        style={[styles.dotPulse, { backgroundColor: color, opacity, transform: [{ scale }] }]}
      />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

export default function AvailabilityBadge({
  status,
  size = "md"
}: {
  status: AvailabilityStatus;
  size?: "sm" | "md";
}) {
  const { fg, tint, label } = availabilityColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: size === "sm" ? colors.cardSurface : tint }]}>
      <PulsingDot color={fg} />
      <Text style={[styles.label, { color: fg }, size === "sm" && styles.labelSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 8
  },
  dotWrap: {
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4
  },
  dotPulse: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4
  },
  label: {
    fontSize: 13,
    fontWeight: "700"
  },
  labelSm: {
    fontSize: 12
  }
});
