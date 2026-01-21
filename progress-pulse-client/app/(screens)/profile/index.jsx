// app/(screens)/profile/index.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Platform, Share, KeyboardAvoidingView, ActivityIndicator
} from "react-native"; // + ActivityIndicator
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import AppLogo from "../../../assets/components/ui/AppLogo";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";
import { API_URL } from "../../../assets/api/client";

import UserInfoSection from "../../../assets/components/screens/profile/UserInfoSection";
import ChangePasswordSection from "../../../assets/components/screens/profile/ChangePasswordSection";
import RoleBasedSection from "../../../assets/components/screens/profile/RoleBasedSection";

const ROLES = { ADMIN: 10, TRAINEE: 20, COACH: 30 };
const alertSafe = (t, m = "") => (Platform.OS === "web" ? alert(`${t}${m ? "\n" + m : ""}`) : Alert.alert(t, m));

/* tiny fetch wrapper */
async function request(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.text();
  const data = raw ? (() => { try { return JSON.parse(raw); } catch { return raw; } })() : null;
  if (!res.ok) {
    const err = new Error((data && data.message) || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = typeof data === "string" ? { raw: data } : data;
    throw err;
  }
  return data;
}

/* clipboard fallback */
const copyText = async (text) => {
  try {
    if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      alertSafe("Copied", text);
      return;
    }
  } catch {}
  alertSafe("Coach Code", text);
};

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState(null);                                // from /api/users/me
  const [loading, setLoading] = useState(true);                          // <- מצב טעינה למסך כולו

  const roleLevel = user?.roleLevel ?? ROLES.TRAINEE;                    // ברירת מחדל TRAINEE בזמן טעינה

  // profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");

  // password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving]             = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // role-based
  const [coachCode, setCoachCode] = useState(null);
  const [joinCode,  setJoinCode]  = useState("");

  /* ----- load profile + coach code ----- */
  const loadMe = useCallback(async () => {
    setLoading(true);                                                    // ← התחלת טעינה
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) throw new Error("Missing access token");

      const me = await request("/api/users/me", { token });
      setUser(me);
      setFirstName(me.firstName || "");
      setLastName(me.lastName || "");
      setEmail(me.email || "");

      if (me.roleLevel === ROLES.COACH) {
        const codeRes = await request("/api/coach/code", { token });
        setCoachCode(codeRes?.code ?? null);
      } else {
        setCoachCode(null);
      }
    } catch (e) {
      alertSafe("Error", e?.payload?.message || e?.message || "Failed to load profile");
    } finally {
      setLoading(false);                                                 // ← סיום טעינה
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  /* ----- save profile ----- */
  const onSaveProfile = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) throw new Error("Missing access token");
      const body = {
        firstName: String(firstName).trim(),
        lastName : String(lastName).trim(),
        email    : String(email).trim().toLowerCase(),
      };
      await request("/api/users/me", { method: "PUT", token, body });
      alertSafe("Saved", "Your profile has been updated.");
      await loadMe();
    } catch (e) {
      alertSafe("Save failed", e?.payload?.message || e?.message || "Please try again");
    } finally {
      setSaving(false);
    }
  };

  /* ----- change password ----- */
  const onChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        alertSafe("Missing fields", "Please fill all password fields.");
        return;
      }
      if (newPassword.length < 6) {
        alertSafe("Weak password", "New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        alertSafe("Mismatch", "New password and confirmation do not match.");
        return;
      }
      setChangingPass(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) throw new Error("Missing access token");
      await request("/api/users/me/password", {
        method: "PUT",
        token,
        body: { currentPassword, newPassword },
      });
      alertSafe("Password changed", "Your password has been updated.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e) {
      alertSafe("Change failed", e?.payload?.message || e?.message || "Please try again");
    } finally {
      setChangingPass(false);
    }
  };

  /* ----- trainee: join with code ----- */
  const onJoinWithCode = async () => {
    const code = (joinCode || "").trim();
    if (!code) {
      alertSafe("Enter a code", "Ask your coach for their code and paste it here.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) throw new Error("Missing access token");
      await request("/api/coach/join", { method: "POST", token, body: { code } });
      alertSafe("Request sent", "Your join request was sent to the coach.");
      setJoinCode("");
    } catch (e) {
      alertSafe("Join failed", e?.payload?.message || e?.message || "Please try again");
    }
  };

  /* ----- coach: share / regenerate code ----- */
  const onShareCoachCode = async () => {
    const message = `Join my coaching on Progress Pulse.\nCoach code: ${coachCode ?? "—"}`;
    try {
      if (Platform.OS === "web") {
        if (navigator?.share) await navigator.share({ title: "Coach Code", text: message });
        else alertSafe("Share", message);
      } else {
        await Share.share({ message });
      }
    } catch {}
  };

  const onRegenerateCoachCode = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) throw new Error("Missing access token");
      const { code } = await request("/api/coach/code/new", { method: "POST", token });
      setCoachCode(code);
      alertSafe("New coach code", code);
    } catch (e) {
      alertSafe("Rotate failed", e?.payload?.message || e?.message || "Please try again");
    }
  };

  /* ----- navigation shortcuts ----- */
  const onOpenHistory         = () => router.push("/(screens)/tracking/training history");
  const onOpenCoachDashboard  = () => router.push("/(screens)/coach");
  const onOpenAdminConsole    = () => router.push("/(screens)/admin");

  /* ----- logout ----- */
  const onLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["accessToken", "roleLevel", "userId"]);
    } catch {}
    router.replace("/(screens)/auth");
  };

  /* ---------- מסך טעינה לפני שהנתונים הגיעו ---------- */
  if (loading) {
    return (
      <View className="flex-1 bg-bg">
        <Stack.Screen
          options={{
            headerTitle: () => <AppLogo />,
            headerTitleAlign: "left",
            headerStyle: { backgroundColor: "#FDFBFA" },
          }}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />{/* אפשר לשים לוגו/לוטי */}
          <Text className="text-muted mt-3">Loading profile…</Text>
        </View>
        
      </View>
    );
  }

  /* ---------- התוכן הרגיל אחרי שהנתונים נטענו ---------- */
  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 140 }} // keeps "Log out" above the tabs
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-text text-2xl font-extrabold">Profile</Text>
          <Text className="text-muted mt-1">Manage your account and connections.</Text>

          {/* User info & fields (email read-only) */}
          <UserInfoSection
            user={user}
            roleLevel={roleLevel}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            onSave={onSaveProfile}
            saving={saving}
            onOpenHistory={onOpenHistory}
          />

          {/* Change password (autofill blocked) */}
          <ChangePasswordSection
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            onChangePassword={onChangePassword}
            changingPass={changingPass}
          />

          {/* Role-based section (trainee / coach / admin) */}
          <RoleBasedSection
            roleLevel={roleLevel}
            // trainee
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            onJoinWithCode={onJoinWithCode}
            // coach
            coachCode={coachCode}
            onCopyCode={copyText}
            onShareCode={onShareCoachCode}
            onRegenerateCode={onRegenerateCoachCode}
            onOpenCoachDashboard={onOpenCoachDashboard}
            // admin
            onOpenAdminConsole={onOpenAdminConsole}
          />

          {/* Logout */}
          <View className="mt-4">
            <TouchableOpacity
              onPress={onLogout}
              className="w-full h-11 rounded-lg bg-card border border-border items-center justify-center"
            >
              <Text className="text-text font-bold">Log out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomTabs role={roleLevel} currentHref="/(screens)/profile" loading={loading} />
    </View>
  );
}
