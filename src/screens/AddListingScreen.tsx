import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/hooks/useAuth";
import { colors, radii } from "@/theme";
import type { RootStackParamList } from "@/navigation/RootNavigator";

const TOTAL_STEPS = 4;

interface FormState {
  title: string;
  location: string;
  price: string;
  deposit: string;
  bedrooms: number;
  bathrooms: number;
  photos: string[];
  availability: "available" | "available_soon";
  availableFrom: string;
  caretakerName: string;
  caretakerPhone: string;
  agencyName: string;
  agencyPhone: string;
}

const initialForm: FormState = {
  title: "",
  location: "",
  price: "",
  deposit: "",
  bedrooms: 1,
  bathrooms: 1,
  photos: [],
  availability: "available",
  availableFrom: "",
  caretakerName: "",
  caretakerPhone: "",
  agencyName: "",
  agencyPhone: ""
};

function Stepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepperButton} onPress={() => onChange(Math.max(0, value - 1))}>
          <Text style={styles.stepperButtonText}>–</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity style={styles.stepperButton} onPress={() => onChange(value + 1)}>
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AddListingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [publishing, setPublishing] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (!result.canceled && result.assets[0]) {
      update("photos", [...form.photos, result.assets[0].uri]);
    }
  }

  function validateStep1(): string | null {
    if (!form.title.trim()) return "Add a listing title.";
    if (!form.location.trim()) return "Add the location or estate.";
    const price = Number(form.price);
    if (!form.price.trim() || Number.isNaN(price) || price <= 0) return "Enter a valid rent amount.";
    if (form.deposit.trim() && (Number.isNaN(Number(form.deposit)) || Number(form.deposit) < 0)) {
      return "Enter a valid deposit amount, or leave it blank.";
    }
    return null;
  }

  function validateStep3(): string | null {
    if (form.availability !== "available_soon") return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.availableFrom.trim())) {
      return "Enter the move-out date as YYYY-MM-DD (e.g. 2026-10-01).";
    }
    return null;
  }

  function handleContinue() {
    if (step === 1) {
      const error = validateStep1();
      if (error) {
        Alert.alert("Missing info", error);
        return;
      }
    }
    if (step === 3) {
      const error = validateStep3();
      if (error) {
        Alert.alert("Check the date", error);
        return;
      }
    }
    setStep(step + 1);
  }

  async function handlePublish() {
    if (!user) return;
    const step1Error = validateStep1();
    if (step1Error) {
      Alert.alert("Missing info", step1Error);
      setStep(1);
      return;
    }
    const step3Error = validateStep3();
    if (step3Error) {
      Alert.alert("Check the date", step3Error);
      setStep(3);
      return;
    }
    setPublishing(true);
    try {
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          owner_id: user.id,
          title: form.title,
          location_text: form.location,
          price_kes: Number(form.price),
          deposit_kes: form.deposit ? Number(form.deposit) : null,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          availability_status: form.availability,
          available_from: form.availableFrom || null
        })
        .select()
        .single();
      if (listingError) throw listingError;

      for (let i = 0; i < form.photos.length; i++) {
        const uri = form.photos[i];
        const fileExt = uri.split(".").pop() ?? "jpg";
        const path = `${user.id}/${listing.id}/${i}.${fileExt}`;
        const response = await fetch(uri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, blob, {
          contentType: blob.type || "image/jpeg"
        });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
        await supabase.from("listing_photos").insert({
          listing_id: listing.id,
          url: publicUrlData.publicUrl,
          position: i
        });
      }

      await supabase.from("listing_contacts").insert({
        listing_id: listing.id,
        caretaker_name: form.caretakerName || null,
        caretaker_phone: form.caretakerPhone || null,
        agency_name: form.agencyName || null,
        agency_phone: form.agencyPhone || null
      });

      await supabase.from("availability_updates").insert({
        listing_id: listing.id,
        status: form.availability,
        updated_by: user.id
      });

      Alert.alert("Listing published", "Thanks for helping the next tenant!");
      setForm(initialForm);
      setStep(1);
      navigation.navigate("Tabs", { screen: "Search" });
    } catch (err) {
      Alert.alert("Couldn't publish listing", err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.progressSegment, i < step && styles.progressSegmentActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Step 1 of 4 — Basics</Text>
            <Text style={styles.label}>Listing title</Text>
            <TextInput style={styles.input} value={form.title} onChangeText={(v) => update("title", v)} placeholder="Kilimani, 2-bed apartment" />
            <Text style={styles.label}>Location / estate</Text>
            <TextInput style={styles.input} value={form.location} onChangeText={(v) => update("location", v)} placeholder="Kilimani" />
            <Text style={styles.label}>Rent / month (KES)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={form.price} onChangeText={(v) => update("price", v)} placeholder="45000" />
            <Text style={styles.label}>Deposit (KES)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={form.deposit} onChangeText={(v) => update("deposit", v)} placeholder="90000" />
            <Stepper label="Bedrooms" value={form.bedrooms} onChange={(v) => update("bedrooms", v)} />
            <Stepper label="Bathrooms" value={form.bathrooms} onChange={(v) => update("bathrooms", v)} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Step 2 of 4 — Photos</Text>
            <Text style={styles.helperText}>
              Photos are the main thing tenants trust — add at least 4 so people can see what they're getting.
            </Text>
            <View style={styles.photoGrid}>
              {form.photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.photoTile} />
              ))}
              <TouchableOpacity style={styles.addPhotoTile} onPress={pickPhoto}>
                <Text style={styles.addPhotoPlus}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Step 3 of 4 — Availability</Text>
            <TouchableOpacity
              style={[styles.radioCard, form.availability === "available" && styles.radioCardActive]}
              onPress={() => update("availability", "available")}
            >
              <Text style={styles.radioTitle}>Already empty</Text>
              <Text style={styles.radioSub}>The unit is free right now.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioCard, form.availability === "available_soon" && styles.radioCardActive]}
              onPress={() => update("availability", "available_soon")}
            >
              <Text style={styles.radioTitle}>Moving out on a set date</Text>
              <Text style={styles.radioSub}>Still living there, know the move-out date.</Text>
            </TouchableOpacity>
            {form.availability === "available_soon" && (
              <TextInput
                style={styles.input}
                placeholder="Available from (YYYY-MM-DD)"
                value={form.availableFrom}
                onChangeText={(v) => update("availableFrom", v)}
              />
            )}
            <Text style={styles.helperNote}>
              You can flip this to "Now occupied" anytime from My Listings once someone moves in.
            </Text>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>Step 4 of 4 — Contacts</Text>
            <Text style={styles.helperText}>
              This stays hidden from other tenants until they subscribe to the KES 250/mo plan.
            </Text>
            <Text style={styles.label}>Caretaker name</Text>
            <TextInput style={styles.input} value={form.caretakerName} onChangeText={(v) => update("caretakerName", v)} />
            <Text style={styles.label}>Caretaker phone</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={form.caretakerPhone} onChangeText={(v) => update("caretakerPhone", v)} />
            <Text style={styles.label}>Agency name (optional)</Text>
            <TextInput style={styles.input} value={form.agencyName} onChangeText={(v) => update("agencyName", v)} />
            <Text style={styles.label}>Agency phone (optional)</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={form.agencyPhone} onChangeText={(v) => update("agencyPhone", v)} />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => (step < TOTAL_STEPS ? handleContinue() : handlePublish())}
          disabled={publishing}
        >
          <Text style={styles.continueButtonText}>
            {step < TOTAL_STEPS ? "Continue" : publishing ? "Publishing…" : "Publish listing"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgScreen, paddingTop: 56 },
  progressBar: { flexDirection: "row", gap: 6, paddingHorizontal: 22, marginBottom: 20 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.grayTint },
  progressSegmentActive: { backgroundColor: colors.accent },
  content: { paddingHorizontal: 22, paddingBottom: 24 },
  stepTitle: { fontSize: 18, fontWeight: "800", color: colors.inkPrimary, marginBottom: 16 },
  helperText: { fontSize: 13, color: colors.inkSecondary, marginBottom: 16, lineHeight: 19 },
  helperNote: { fontSize: 12, color: colors.inkTertiary, marginTop: 12 },
  label: { fontSize: 12, fontWeight: "700", color: colors.inkSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  stepperRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: 14 },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayTint,
    alignItems: "center",
    justifyContent: "center"
  },
  stepperButtonText: { fontSize: 18, fontWeight: "700", color: colors.inkPrimary },
  stepperValue: { fontSize: 16, fontWeight: "700", color: colors.inkPrimary, minWidth: 20, textAlign: "center" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoTile: { width: "47%", aspectRatio: 1, borderRadius: 12 },
  addPhotoTile: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderCard,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center"
  },
  addPhotoPlus: { fontSize: 28, color: colors.inkTertiary },
  radioCard: {
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radii.card,
    padding: 16,
    marginBottom: 12
  },
  radioCardActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  radioTitle: { fontWeight: "800", color: colors.inkPrimary, fontSize: 15 },
  radioSub: { color: colors.inkSecondary, fontSize: 12, marginTop: 4 },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 22, paddingBottom: 28, paddingTop: 12 },
  backButton: { paddingVertical: 15, paddingHorizontal: 20 },
  backButtonText: { color: colors.inkSecondary, fontWeight: "700" },
  continueButton: { flex: 1, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  continueButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 }
});
