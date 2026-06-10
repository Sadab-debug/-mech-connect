import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const ROLE_LABELS: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  user: { label: "Customer", color: "#7e57c2", icon: "person" },
  mechanic: { label: "Mechanic", color: "#20c997", icon: "construct" },
  admin: { label: "Admin", color: "#ef4444", icon: "shield" },
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!user) return null;

  const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.user;

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/(auth)/login"));
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
    scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: Platform.OS === "web" ? 100 : 24 + insets.bottom },
    avatarSection: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      padding: 28,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: "700",
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    fullName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: roleInfo.color + "18",
    },
    roleBadgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: roleInfo.color,
      fontFamily: "Inter_600SemiBold",
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      overflow: "hidden",
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.6,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 13,
      gap: 12,
    },
    rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.muted,
      justifyContent: "center",
      alignItems: "center",
    },
    rowLabel: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    rowValue: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    logoutBtn: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      marginTop: 8,
    },
    logoutRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    logoutIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: "#fee2e2",
      justifyContent: "center",
      alignItems: "center",
    },
    logoutText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.destructive,
      fontFamily: "Inter_600SemiBold",
    },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.avatarSection}>
          <View style={[s.avatar, { backgroundColor: roleInfo.color }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.fullName}>{user.full_name}</Text>
          <Text style={s.email}>{user.email}</Text>
          <View style={s.roleBadge}>
            <Ionicons name={roleInfo.icon} size={14} color={roleInfo.color} />
            <Text style={s.roleBadgeText}>{roleInfo.label}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>ACCOUNT INFO</Text>
          <View style={s.row}>
            <View style={s.rowIcon}>
              <Ionicons name="at-outline" size={18} color={colors.mutedForeground} />
            </View>
            <Text style={s.rowLabel}>Username</Text>
            <Text style={s.rowValue}>@{user.username}</Text>
          </View>
          <View style={[s.row, s.rowBorder]}>
            <View style={s.rowIcon}>
              <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
            </View>
            <Text style={s.rowLabel}>Email</Text>
            <Text style={s.rowValue}>{user.email}</Text>
          </View>
          <View style={[s.row, s.rowBorder]}>
            <View style={s.rowIcon}>
              <Ionicons name="shield-outline" size={18} color={colors.mutedForeground} />
            </View>
            <Text style={s.rowLabel}>Role</Text>
            <Text style={s.rowValue}>{roleInfo.label}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} testID="logout-btn">
          <View style={s.logoutRow}>
            <View style={s.logoutIcon}>
              <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
            </View>
            <Text style={s.logoutText}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
