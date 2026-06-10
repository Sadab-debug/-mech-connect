import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiGet } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

interface Mechanic {
  id: number;
  full_name: string;
  workshop_name: string;
  expertise: string;
  location: string;
  hourly_rate: number;
  rating?: number;
  is_available?: boolean;
}

function Stars({ rating }: { rating: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={12}
          color={i <= Math.round(rating) ? "#f59e0b" : colors.mutedForeground}
        />
      ))}
    </View>
  );
}

function MechanicCard({ mechanic }: { mechanic: Mechanic }) {
  const colors = useColors();

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      gap: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 14,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    content: { flex: 1 },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    name: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      flex: 1,
    },
    availDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: mechanic.is_available ? "#20c997" : colors.mutedForeground,
    },
    workshop: {
      fontSize: 12,
      color: colors.primary,
      fontFamily: "Inter_500Medium",
      marginBottom: 4,
    },
    expertise: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 8,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    location: { flexDirection: "row", alignItems: "center", gap: 3 },
    locationText: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    rateRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
    rate: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.accent,
      fontFamily: "Inter_700Bold",
    },
    rateUnit: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
  });

  const initials = mechanic.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.75}
      onPress={() => router.push(`/mechanic/${mechanic.id}`)}
      testID={`mechanic-${mechanic.id}`}
    >
      <View style={s.avatar}>
        <Text style={s.avatarText}>{initials}</Text>
      </View>
      <View style={s.content}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>
            {mechanic.full_name}
          </Text>
          <View style={s.availDot} />
        </View>
        <Text style={s.workshop} numberOfLines={1}>
          {mechanic.workshop_name}
        </Text>
        <Text style={s.expertise} numberOfLines={1}>
          {mechanic.expertise}
        </Text>
        <View style={s.footer}>
          <View style={s.location}>
            <Ionicons
              name="location-outline"
              size={11}
              color={colors.mutedForeground}
            />
            <Text style={s.locationText} numberOfLines={1}>
              {mechanic.location}
            </Text>
          </View>
          <View style={s.rateRow}>
            <Text style={s.rate}>৳{mechanic.hourly_rate?.toLocaleString()}</Text>
            <Text style={s.rateUnit}>/hr</Text>
          </View>
        </View>
        {mechanic.rating ? (
          <View style={{ marginTop: 6 }}>
            <Stars rating={mechanic.rating} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function MechanicsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const {
    data: mechanics,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Mechanic[]>({
    queryKey: ["mechanics"],
    queryFn: async () => {
      const res = await apiGet("/mechanics");
      if (!res.ok) throw new Error("Failed to load mechanics");
      const data = await res.json();
      return data.mechanics ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!mechanics) return [];
    const q = search.toLowerCase();
    if (!q) return mechanics;
    return mechanics.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.workshop_name?.toLowerCase().includes(q) ||
        m.expertise?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q)
    );
  }, [mechanics, search]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingTop: Platform.OS === "web" ? 67 + 8 : insets.top + 8,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 12,
      height: 42,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    list: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: Platform.OS === "web" ? 100 : 24 + insets.bottom,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      paddingHorizontal: 32,
    },
    count: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      paddingBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
    },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      marginTop: 4,
    },
    retryText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      fontFamily: "Inter_600SemiBold",
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Find Mechanics</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : null}
        </View>
        <View style={s.searchRow}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.mutedForeground}
          />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, expertise..."
            placeholderTextColor={colors.mutedForeground}
            clearButtonMode="while-editing"
            testID="search-input"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isError ? (
        <View style={s.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.mutedForeground}
          />
          <Text style={s.errorText}>Failed to load mechanics</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MechanicCard mechanic={item} />}
          contentContainerStyle={[
            s.list,
            filtered.length === 0 && { flex: 1 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            mechanics && mechanics.length > 0 ? (
              <Text style={s.count}>
                {filtered.length} mechanic{filtered.length !== 1 ? "s" : ""} found
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={s.center}>
                <Ionicons
                  name="construct-outline"
                  size={52}
                  color={colors.mutedForeground}
                />
                <Text style={s.emptyTitle}>No mechanics found</Text>
                <Text style={s.emptyText}>
                  {search
                    ? "Try a different search term"
                    : "No approved mechanics yet"}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
