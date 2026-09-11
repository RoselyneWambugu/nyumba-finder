import React, { useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PlaceholderPhoto from "@/components/PlaceholderPhoto";
import { colors, radii } from "@/theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Real reviews from real tenants.",
    body: "No agent spin. Ratings on the caretaker, repairs, electricity and water come from people who actually lived there."
  },
  {
    title: "Know before you move in.",
    body: "See if rent, deposits, water and power have been fair — and whether the unit is actually free right now."
  },
  {
    title: "List your old place in minutes.",
    body: "Moving out? Help the next tenant find it — and get paid nothing, it's free to post."
  }
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: i }) => (
          <View style={[styles.slide, { width }]}>
            <PlaceholderPhoto seed={`onboarding-${i}`} height={460} label="" />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        {!isLast ? (
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={onDone}>
            <Text style={styles.buttonText}>Get started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen },
  slide: { paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: "800", color: colors.inkPrimary, marginTop: 28 },
  body: { fontSize: 14, color: colors.inkSecondary, marginTop: 10, lineHeight: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, alignItems: "center" },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderSubtle },
  dotActive: { backgroundColor: colors.accent, width: 20 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.card,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center"
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 }
});
