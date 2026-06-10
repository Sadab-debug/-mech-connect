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
import { apiPost } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function SignupScreen() {
  const { login } = useAuth();
  const colors = useColors();
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [role, setRole] = useState<"user" | "mechanic">("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSignup = async () => {
    const { username, full_name, email, password, confirm_password } = form;
    if (!username || !full_name || !email || !password) {
      setError("All fields are required");
      return;
    }
    if (password !== confirm_password) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiPost("/signup", {
        username,
        full_name,
        email,
        password,
        role,
      });
      const data = await res.json();
      if (data.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const loginResult = await login(email, password, role);
        if (loginResult.success) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      } else {
        setError(data.message || "Signup failed");
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
      paddingTop: Platform.OS === "web" ? 100 : 50,
      paddingBottom: Platform.OS === "web" ? 50 : 24,
    },
    brand: { alignItems: "center", marginBottom: 28 },
    brandIcon: {
      width: 60,
      height: 60,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    brandName: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
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
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 20,
    },
    roleRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
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
      marginBottom: 5,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      marginBottom: 14,
      paddingHorizontal: 14,
    },
    input: {
      flex: 1,
      height: 46,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      fontSize: 14,
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
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 20, gap: 4 },
    footerText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    footerLink: { color: colors.primary, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  });

  const fields: Array<{
    key: keyof typeof form;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    keyboard?: "email-address" | "default";
    secure?: boolean;
    isPasswordToggle?: boolean;
  }> = [
    { key: "username", label: "Username", icon: "at-outline", placeholder: "johndoe" },
    { key: "full_name", label: "Full Name", icon: "person-outline", placeholder: "John Doe" },
    { key: "email", label: "Email", icon: "mail-outline", placeholder: "your@email.com", keyboard: "email-address" },
    { key: "password", label: "Password", icon: "lock-closed-outline", placeholder: "Create a password", secure: true, isPasswordToggle: true },
    { key: "confirm_password", label: "Confirm Password", icon: "lock-closed-outline", placeholder: "Confirm password", secure: true },
  ];

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
            <Ionicons name="construct" size={28} color="#fff" />
          </View>
          <Text style={s.brandName}>Create Account</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Join MistriVai</Text>
          <Text style={s.subtitle}>Get started today — it's free</Text>

          <View style={s.roleRow}>
            {(["user", "mechanic"] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.roleBtn, role === r ? s.roleBtnActive : s.roleBtnInactive]}
                onPress={() => setRole(r)}
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

          {fields.map((f) => (
            <React.Fragment key={f.key}>
              <Text style={s.label}>{f.label}</Text>
              <View style={s.inputRow}>
                <Ionicons
                  name={f.icon}
                  size={17}
                  color={colors.mutedForeground}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={s.input}
                  value={form[f.key]}
                  onChangeText={update(f.key)}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={f.keyboard ?? "default"}
                  autoCapitalize={f.keyboard === "email-address" ? "none" : "words"}
                  autoCorrect={false}
                  secureTextEntry={f.secure && !showPassword}
                  testID={`${f.key}-input`}
                />
                {f.isPasswordToggle && (
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={17}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </React.Fragment>
          ))}

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={loading}
            testID="signup-btn"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={s.footerLink}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
