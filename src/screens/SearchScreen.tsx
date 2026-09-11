import React, { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Avatar from "@/components/Avatar";
import FilterBar from "@/components/FilterBar";
import ListingCard from "@/components/ListingCard";
import { useAuth } from "@/hooks/useAuth";
import { useListings } from "@/hooks/useListings";
import { useSavedListings } from "@/hooks/useSavedListings";
import { colors } from "@/theme";
import type { ListingFilters } from "@/types";
import type { RootStackParamList } from "@/navigation/RootNavigator";

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [filters, setFilters] = useState<ListingFilters>({});
  const { listings, loading } = useListings(filters);
  const { savedIds, toggleSave } = useSavedListings(user?.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nairobi</Text>
        <Avatar name={user?.user_metadata?.full_name} size={40} />
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by area, e.g. Kilimani"
        value={filters.location ?? ""}
        onChangeText={(text) => setFilters((f) => ({ ...f, location: text || undefined }))}
      />

      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No listings match your filters yet.</Text>}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              saved={savedIds.has(item.id)}
              onToggleSave={() => toggleSave(item.id)}
              onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen, paddingHorizontal: 22, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: colors.inkPrimary },
  searchInput: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    marginBottom: 14
  },
  loader: { marginTop: 40 },
  list: { paddingBottom: 24 },
  empty: { textAlign: "center", color: colors.inkTertiary, marginTop: 40 }
});
