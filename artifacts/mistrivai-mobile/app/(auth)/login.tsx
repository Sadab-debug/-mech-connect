import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const { login } = useAuth();
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"user" | "mechanic">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await login(email.trim(), password, role);
      if (result.success) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        router.replace("/(tabs)");
      } else {
        setError(result.message || "Invalid email or password");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "web" ? 100 : 60,
      paddingBottom: Platform.OS === "web" ? 50 : 24,
    },
    brand: { alignItems: "center", marginBottom: 36 },
    brandIcon: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    brandName: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
    },
    brandSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 4,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 22,
    },
    roleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    roleBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: colors.radius,
      borderWidth: 1.5,
      alignItems: "center",
    },
    roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleBtnInactive: { backgroundColor: "transparent", borderColor: colors.border },
    roleBtnText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    roleBtnTextActive: { color: "#fff" },
    roleBtnTextInactive: { color: colors.mutedForeground },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 6,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      marginBottom: 16,
      paddingHorizontal: 14,
    },
    input: {
      flex: 1,
      height: 48,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
    },
    error: {
      color: colors.destructive,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
      textAlign: "center",
    },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 4,
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 4 },
    footerText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    footerLink: { color: colors.primary, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={s.container}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.brand}>
          <View style={s.brandIcon}>
            <Ionicons name="construct" size={34} color="#fff" />
          </View>
          <Text style={s.brandName}>MistriVai</Text>
          <Text style={s.brandSub}>Bangladesh's Mechanic Platform</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to continue</Text>

          <View style={s.roleRow}>
            {(["user", "mechanic"] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.roleBtn, role === r ? s.roleBtnActive : s.roleBtnInactive]}
                onPress={() => setRole(r)}
                testID={`role-${r}`}
              >
                <Text
                  style={[
                    s.roleBtnText,
                    role === r ? s.roleBtnTextActive : s.roleBtnTextInactive,
                  ]}
                >
                  {r === "user" ? "Customer" : "Mechanic"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Email</Text>
          <View style={s.inputRow}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={colors.mutedForeground}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="email-input"
            />
          </View>

          <Text style={s.label}>Password</Text>
          <View style={s.inputRow}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={colors.mutedForeground}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              testID="password-input"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-btn"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/signup")}>
            <Text style={s.footerLink}> Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
