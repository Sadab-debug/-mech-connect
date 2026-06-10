import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MechanicDetail {
  id: number;
  full_name: string;
  workshop_name: string;
  expertise: string;
  location: string;
  hourly_rate: number;
  experience_years?: number;
  bio?: string;
  phone?: string;
  rating?: number;
  is_available?: boolean;
}

function Stars({ rating }: { rating: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={14}
          color={i <= Math.round(rating) ? "#f59e0b" : colors.mutedForeground}
        />
      ))}
      <Text
        style={{
          fontSize: 13,
          color: "#f59e0b",
          fontFamily: "Inter_600SemiBold",
          marginLeft: 4,
        }}
      >
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

export default function MechanicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [description, setDescription] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const deposit = offerAmount
    ? Math.round(parseFloat(offerAmount) * 0.3)
    : 0;
  const platformFee = offerAmount
    ? Math.round(parseFloat(offerAmount) * 0.05)
    : 0;
  const total = deposit + platformFee;
  const isValidOffer = offerAmount && !isNaN(parseFloat(offerAmount)) && parseFloat(offerAmount) > 0;

  const { data: mechanic, isLoading, isError } = useQuery<MechanicDetail>({
    queryKey: ["mechanic", id],
    queryFn: async () => {
      const res = await apiGet(`/mechanics/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      return data.mechanic ?? data;
    },
    enabled: !!id,
  });

  const handleBook = async () => {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (!description.trim()) {
      setBookingError("Please describe the work needed");
      return;
    }
    if (!isValidOffer) {
      setBookingError("Please enter a valid offer amount");
      return;
    }
    setBookingError("");
    setSubmitting(true);
    try {
      const res = await apiPost("/bookings", {
        mechanic_id: parseInt(id as string),
        description: description.trim(),
        offer_amount: parseFloat(offerAmount),
      });
      const data = await res.json();
      if (data.success || data.booking) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (Platform.OS === "web") {
          setDescription("");
          setOfferAmount("");
          router.push("/(tabs)/bookings");
        } else {
          Alert.alert("Booking Sent!", "Your booking request has been submitted. The mechanic will review it shortly.", [
            { text: "View Bookings", onPress: () => router.push("/(tabs)/bookings") },
            { text: "OK" },
          ]);
        }
      } else {
        setBookingError(data.message || "Failed to submit booking");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setBookingError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    errorText: { fontSize: 14, color: colors.destructive, fontFamily: "Inter_400Regular" },
    scroll: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: Platform.OS === "web" ? 60 : 24 + insets.bottom,
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      padding: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      gap: 16,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 18,
      backgroundColor: colors.primary + "18",
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    heroInfo: { flex: 1 },
    name: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 3,
    },
    workshop: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 6,
    },
    expertiseBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
      backgroundColor: colors.accent + "18",
      marginBottom: 8,
    },
    expertiseText: {
      fontSize: 12,
      color: colors.accent,
      fontFamily: "Inter_600SemiBold",
    },
    statsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 2 },
    statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    statText: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    bio: {
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      lineHeight: 21,
    },
    rateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rateLabel: { fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular" },
    rateValue: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.accent,
      fontFamily: "Inter_700Bold",
    },
    rateUnit: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    bookCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      padding: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    bookSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 18,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 6,
    },
    textarea: {
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      padding: 12,
      minHeight: 80,
      textAlignVertical: "top",
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      marginBottom: 14,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    currency: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
      height: 48,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 16,
    },
    breakdown: {
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      padding: 14,
      gap: 8,
      marginBottom: 16,
    },
    breakdownTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    breakdownRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    breakdownLabel: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    breakdownValue: { fontSize: 13, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    breakdownAccent: { color: colors.accent },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
    totalLabel: { fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    totalValue: { fontSize: 14, fontWeight: "700", color: colors.primary, fontFamily: "Inter_700Bold" },
    bookingError: {
      color: colors.destructive,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
      textAlign: "center",
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      height: 52,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    submitText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  });

  if (isLoading) {
    return (
      <View style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError || !mechanic) {
    return (
      <View style={s.container}>
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={s.errorText}>Mechanic not found</Text>
          <TouchableOpacity
            style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: colors.radius }}
            onPress={() => router.back()}
          >
            <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const initials = mechanic.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={s.container}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.heroCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.heroInfo}>
            <Text style={s.name}>{mechanic.full_name}</Text>
            <Text style={s.workshop}>{mechanic.workshop_name}</Text>
            <View style={s.expertiseBadge}>
              <Text style={s.expertiseText}>{mechanic.expertise}</Text>
            </View>
            <View style={s.statsRow}>
              {mechanic.rating ? <Stars rating={mechanic.rating} /> : null}
              <View style={s.statItem}>
                <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                <Text style={s.statText}>{mechanic.location}</Text>
              </View>
              {mechanic.experience_years ? (
                <View style={s.statItem}>
                  <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                  <Text style={s.statText}>{mechanic.experience_years}y exp</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {mechanic.bio ? (
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>ABOUT</Text>
            <Text style={s.bio}>{mechanic.bio}</Text>
          </View>
        ) : null}

        <View style={s.infoCard}>
          <Text style={s.infoTitle}>PRICING</Text>
          <View style={s.rateRow}>
            <Text style={s.rateLabel}>Hourly rate</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
              <Text style={s.rateValue}>৳{mechanic.hourly_rate?.toLocaleString()}</Text>
              <Text style={s.rateUnit}>/hr</Text>
            </View>
          </View>
        </View>

        <View style={s.bookCard}>
          <Text style={s.bookTitle}>Book This Mechanic</Text>
          <Text style={s.bookSubtitle}>Describe your problem and set your offer</Text>

          <Text style={s.label}>What do you need fixed?</Text>
          <TextInput
            style={s.textarea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue or work needed..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            testID="description-input"
          />

          <Text style={s.label}>Your Offer (৳)</Text>
          <View style={s.amountRow}>
            <Text style={s.currency}>৳</Text>
            <TextInput
              style={s.amountInput}
              value={offerAmount}
              onChangeText={setOfferAmount}
              placeholder="Enter your offer"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              testID="offer-input"
            />
          </View>

          {isValidOffer ? (
            <View style={s.breakdown}>
              <Text style={s.breakdownTitle}>PAYMENT BREAKDOWN</Text>
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>Total Offer</Text>
                <Text style={s.breakdownValue}>৳{parseFloat(offerAmount).toLocaleString()}</Text>
              </View>
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>30% Deposit</Text>
                <Text style={[s.breakdownValue, s.breakdownAccent]}>৳{deposit.toLocaleString()}</Text>
              </View>
              <View style={s.breakdownRow}>
                <Text style={s.breakdownLabel}>5% Platform Fee</Text>
                <Text style={s.breakdownValue}>৳{platformFee.toLocaleString()}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.breakdownRow}>
                <Text style={s.totalLabel}>Due Now</Text>
                <Text style={s.totalValue}>৳{total.toLocaleString()}</Text>
              </View>
            </View>
          ) : null}

          {bookingError ? <Text style={s.bookingError}>{bookingError}</Text> : null}

          <TouchableOpacity
            style={[s.submitBtn, (submitting || !user) && { opacity: 0.7 }]}
            onPress={handleBook}
            disabled={submitting}
            testID="submit-booking-btn"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={s.submitText}>
                  {user ? "Send Booking Request" : "Sign in to Book"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
