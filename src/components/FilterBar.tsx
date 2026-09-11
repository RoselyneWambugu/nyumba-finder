import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, radii } from "@/theme";
import type { AvailabilityStatus, ListingFilters } from "@/types";

const AVAILABILITY_OPTIONS: { label: string; value: AvailabilityStatus | undefined }[] = [
  { label: "Any", value: undefined },
  { label: "Available now", value: "available" },
  { label: "Available soon", value: "available_soon" },
  { label: "Occupied", value: "occupied" }
];

const BEDROOM_OPTIONS: { label: string; value: number | undefined }[] = [
  { label: "Any", value: undefined },
  { label: "Bedsitter", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3+", value: 3 }
];

type FilterKey = "location" | "price" | "bedrooms" | "availability";

export default function FilterBar({
  filters,
  onChange
}: {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}) {
  const [openSheet, setOpenSheet] = useState<FilterKey | null>(null);
  const [locationDraft, setLocationDraft] = useState(filters.location ?? "");
  const [maxPriceDraft, setMaxPriceDraft] = useState(filters.maxPrice ? String(filters.maxPrice) : "");

  // Re-sync drafts to the live filter value whenever a sheet opens, since
  // filters.location can also change from the search bar outside this component.
  useEffect(() => {
    if (openSheet === "location") setLocationDraft(filters.location ?? "");
    if (openSheet === "price") setMaxPriceDraft(filters.maxPrice ? String(filters.maxPrice) : "");
  }, [openSheet, filters.location, filters.maxPrice]);

  const chips: { key: FilterKey; label: string; active: boolean }[] = [
    { key: "location", label: "Location", active: Boolean(filters.location) },
    { key: "price", label: "Price", active: filters.maxPrice != null },
    { key: "bedrooms", label: "Bedrooms", active: filters.bedrooms != null },
    { key: "availability", label: "Availability", active: Boolean(filters.availability) }
  ];

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, chip.active && styles.chipActive]}
            onPress={() => setOpenSheet(chip.key)}
          >
            <Text style={[styles.chipText, chip.active && styles.chipTextActive]}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={openSheet !== null} transparent animationType="slide" onRequestClose={() => setOpenSheet(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpenSheet(null)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            {openSheet === "location" && (
              <>
                <Text style={styles.sheetTitle}>Search by area</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Kilimani"
                  value={locationDraft}
                  onChangeText={setLocationDraft}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {
                    onChange({ ...filters, location: locationDraft || undefined });
                    setOpenSheet(null);
                  }}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </>
            )}

            {openSheet === "price" && (
              <>
                <Text style={styles.sheetTitle}>Max rent (KES/mo)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 40000"
                  keyboardType="numeric"
                  value={maxPriceDraft}
                  onChangeText={setMaxPriceDraft}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => {
                    onChange({ ...filters, maxPrice: maxPriceDraft ? Number(maxPriceDraft) : undefined });
                    setOpenSheet(null);
                  }}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </>
            )}

            {openSheet === "bedrooms" && (
              <>
                <Text style={styles.sheetTitle}>Bedrooms</Text>
                {BEDROOM_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={styles.optionRow}
                    onPress={() => {
                      onChange({ ...filters, bedrooms: option.value });
                      setOpenSheet(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.bedrooms === option.value && styles.optionTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {openSheet === "availability" && (
              <>
                <Text style={styles.sheetTitle}>Availability</Text>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={styles.optionRow}
                    onPress={() => {
                      onChange({ ...filters, availability: option.value });
                      setOpenSheet(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.availability === option.value && styles.optionTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexGrow: 0,
    marginBottom: 4
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    marginRight: 8
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  chipText: {
    color: colors.inkPrimary,
    fontSize: 13,
    fontWeight: "700"
  },
  chipTextActive: {
    color: "#fff"
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(33,25,20,0.4)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    gap: 10
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.inkPrimary,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.grayTint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  applyButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  optionRow: {
    paddingVertical: 12
  },
  optionText: {
    fontSize: 15,
    color: colors.inkPrimary
  },
  optionTextActive: {
    color: colors.accent,
    fontWeight: "700"
  }
});
