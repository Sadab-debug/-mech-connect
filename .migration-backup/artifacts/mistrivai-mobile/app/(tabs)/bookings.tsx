import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiGet } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

interface Booking {
  id: number;
  mechanic_name: string;
  mechanic_workshop: string;
  description: string;
  offer_amount: number;
  deposit_amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  payment_status?: string;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  requested: { bg: "#fef3c7", text: "#92400e", icon: "time-outline" },
  confirmed: { bg: "#d1fae5", text: "#065f46", icon: "checkmark-circle-outline" },
  completed: { bg: "#dbeafe", text: "#1e40af", icon: "ribbon-outline" },
  rejected: { bg: "#fee2e2", text: "#991b1b", icon: "close-circle-outline" },
  cancelled: { bg: "#f3f4f6", text: "#374151", icon: "ban-outline" },
  countered: { bg: "#ede9fe", text: "#5b21b6", icon: "swap-horizontal-outline" },
};

function BookingCard({ booking }: { booking: Booking }) {
  const colors = useColors();
  const st = STATUS_STYLES[booking.status] ?? STATUS_STYLES.requested;

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    mechanic: { flex: 1 },
    mechanicName: { fontSize: 16, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    workshop: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: st.bg,
    },
    badgeText: { fontSize: 11, fontWeight: "600", color: st.text, fontFamily: "Inter_600SemiBold" },
    desc: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 12, lineHeight: 18 },
    amounts: { flexDirection: "row", gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    amountItem: { flex: 1 },
    amountLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 2 },
    amountValue: { fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    accentValue: { color: colors.accent },
    date: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8, textAlign: "right" },
  });

  const dateStr = booking.created_at
    ? new Date(booking.created_at).toLocaleDateString("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.mechanic}>
          <Text style={s.mechanicName}>{booking.mechanic_name}</Text>
          <Text style={s.workshop}>{booking.mechanic_workshop}</Text>
        </View>
        <View style={s.badge}>
          <Ionicons name={st.icon} size={12} color={st.text} />
          <Text style={s.badgeText}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</Text>
        </View>
      </View>

      <Text style={s.desc} numberOfLines={2}>{booking.description}</Text>

      <View style={s.amounts}>
        <View style={s.amountItem}>
          <Text style={s.amountLabel}>Offer</Text>
          <Text style={s.amountValue}>৳{booking.offer_amount?.toLocaleString()}</Text>
        </View>
        {booking.deposit_amount ? (
          <View style={s.amountItem}>
            <Text style={s.amountLabel}>Deposit (30%)</Text>
            <Text style={[s.amountValue, s.accentValue]}>
              ৳{booking.deposit_amount?.toLocaleString()}
            </Text>
          </View>
        ) : null}
        {booking.platform_fee ? (
          <View style={s.amountItem}>
            <Text style={s.amountLabel}>Platform (5%)</Text>
            <Text style={s.amountValue}>৳{booking.platform_fee?.toLocaleString()}</Text>
          </View>
        ) : null}
      </View>
      {dateStr ? <Text style={s.date}>{dateStr}</Text> : null}
    </View>
  );
}

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const {
    data: bookings,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Booking[]>({
    queryKey: ["my-bookings"],
    queryFn: async () => {
      const res = await apiGet("/my-bookings");
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      return data.bookings ?? [];
    },
  });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 67 + 8 : insets.top + 8,
      paddingBottom: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    list: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: Platform.OS === "web" ? 100 : 24 + insets.bottom,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    emptyText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
    errorText: { fontSize: 14, color: colors.destructive, fontFamily: "Inter_400Regular" },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
    },
    retryText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    browseCta: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    browseCtaText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  });

  if (isLoading) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>My Bookings</Text>
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>My Bookings</Text>
        </View>
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
          <Text style={s.errorText}>Failed to load bookings</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Bookings</Text>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={[
          s.list,
          (!bookings || bookings.length === 0) && { flex: 1 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={s.center}>
            <Ionicons name="calendar-outline" size={56} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>No bookings yet</Text>
            <Text style={s.emptyText}>Book a mechanic to get started</Text>
            <TouchableOpacity
              style={s.browseCta}
              onPress={() => router.navigate("/(tabs)")}
            >
              <Ionicons name="construct-outline" size={16} color="#fff" />
              <Text style={s.browseCtaText}>Browse Mechanics</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
