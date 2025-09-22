// app/(screens)/profile/index.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  Share,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppLogo from "../../../assets/components/ui/AppLogo";
import BottomTabs from "../../../assets/components/navigation/BottomTabs"; // <-- tabs


/* ===== role numbers =====
   10 = admin, 20 = trainee, 30 = coach
*/
const ROLES = { ADMIN: 10, TRAINEE: 20, COACH: 30 };
const roleLabel = (n) =>
  n === ROLES.ADMIN ? "admin" : n === ROLES.COACH ? "coach" : "trainee";

/* ===== Demo user (replace with your auth state) ===== */
const DEMO_USER = {
  id: "me-001",
  name: "Sam Fit",
  email: "sam@example.com",
  avatarUrl: "",
  role: ROLES.TRAINEE, // change to 10/20/30 to see each view
  coachCode: "FITSAM-4821", // only used when role === coach
};

/* ===== helpers ===== */
function alertSafe(title, msg = "") {
  if (Platform.OS === "web") alert(`${title}${msg ? "\n" + msg : ""}`);
  else Alert.alert(title, msg);
}
async function copyText(text) {
  try {
    if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      alertSafe("Copied", text);
      return;
    }
  } catch {}
  alertSafe("Coach Code", text);
}
/** Demo-only code generator (server must enforce uniqueness) */
function generateCoachCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${pick(4)}-${pick(4)}`;
}

export default function ProfileScreen() {
  const router = useRouter();

  // user state (swap to your real store/API)
  const [user, setUser] = useState(DEMO_USER);
  const isAdmin = user.role === ROLES.ADMIN;
  const isCoach = user.role === ROLES.COACH;
  const isTrainee = user.role === ROLES.TRAINEE;

  // editable fields
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  // trainee: join a coach
  const [joinCode, setJoinCode] = useState("");

  // coach-only: code management
  const [coachCode, setCoachCode] = useState(user.coachCode);

  const onSaveProfile = () => {
    setUser((u) => ({
      ...u,
      name: name.trim() || u.name,
      email: email.trim() || u.email,
    }));
    alertSafe("Saved", "Your profile has been updated.");
  };

  const onPressTrainingHistory = () => {
    router.push("/(screens)/tracking/training history");
  };
  const onPressCoachDashboard = () => {
    router.push("/(screens)/coach");
  };
  const onPressAdminConsole = () => {
    router.push("/(screens)/admin");
  };

  const onJoinWithCode = () => {
    const code = joinCode.trim();
    if (!code) {
      alertSafe("Enter a code", "Ask your coach for their code and paste it here.");
      return;
    }
    // TODO: POST /coach-requests { code }
    alertSafe("Request sent", `We sent a join request using code: ${code}`);
    setJoinCode("");
  };

  const regenerateCoachCode = () => {
    const next = generateCoachCode();
    setCoachCode(next);
    setUser((u) => ({ ...u, coachCode: next }));
    // TODO: POST /coach/code { newCode: next } (unique index enforced server-side)
  };

  const shareCoachCode = async () => {
    const message = `Join my coaching on Progress Pulse.\nCoach code: ${coachCode}`;
    try {
      if (Platform.OS === "web") {
        if (navigator?.share) await navigator.share({ title: "Coach Code", text: message });
        else alertSafe("Share this code", message);
      } else {
        await Share.share({ message });
      }
    } catch {}
  };

  const onLogout = async () => {
    try {
      await AsyncStorage.removeItem("token"); // adjust if your token key is different
    } catch {}
    router.replace("/(screens)/auth"); // back to login
  };

  const Avatar = () => (
    <View className="w-16 h-16 rounded-full bg-field border border-fieldBorder items-center justify-center overflow-hidden">
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} className="w-16 h-16" />
      ) : (
        <Text className="text-primary font-extrabold text-xl">
          {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );

  const Field = ({ label, children }) => (
    <View className="mb-3">
      <Text className="text-muted mb-1">{label}</Text>
      {children}
    </View>
  );

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Title */}
        <Text className="text-text text-2xl font-extrabold">Profile</Text>
        <Text className="text-muted mt-1">Manage your account and connections.</Text>

        {/* Identity card */}
        <View className="mt-4 bg-card rounded-xl border border-border p-4">
          <View className="flex-row items-center gap-3">
            <Avatar />
            <View className="flex-1">
              <Text className="text-text font-bold text-lg">{user.name}</Text>
              <Text className="text-muted">{user.email}</Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-primary/90">
              <Text className="text-onPrimary font-extrabold text-xs">
                {roleLabel(user.role)}
              </Text>
            </View>
          </View>

          {/* Editable fields */}
          <View className="mt-4">
            <Field label="Name">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#667085"
                className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
              />
            </Field>

            <Field label="Email">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#667085"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
              />
            </Field>

            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity
                onPress={onSaveProfile}
                className="px-4 h-11 rounded-lg bg-primary items-center justify-center"
              >
                <Text className="text-onPrimary font-extrabold">Save changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onPressTrainingHistory}
                className="px-4 h-11 rounded-lg bg-field border border-fieldBorder items-center justify-center"
              >
                <Text className="text-text font-bold">Training history</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Trainee-only: Join a coach */}
        {isTrainee && (
          <View className="mt-4 bg-card rounded-xl border border-border p-4">
            <Text className="text-text font-extrabold mb-2">Join a coach</Text>
            <Text className="text-muted mb-3">
              Enter the code your coach shared with you to send a join request.
            </Text>

            <View className="flex-row gap-2">
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="e.g. ABCD-234F"
                placeholderTextColor="#667085"
                autoCapitalize="characters"
                className="flex-1 bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
              />
              <TouchableOpacity
                onPress={onJoinWithCode}
                className="px-4 h-11 rounded-lg bg-primary items-center justify-center"
              >
                <Text className="text-onPrimary font-extrabold">Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Coach-only: Code panel + dashboard link */}
        {isCoach && (
          <View className="mt-4 bg-card rounded-xl border border-border p-4">
            <Text className="text-text font-extrabold mb-2">Your coach code</Text>

            <View className="flex-row flex-wrap gap-2 items-stretch">
              <View className="flex-row items-center px-3 rounded-lg bg-field border border-fieldBorder h-11 flex-1">
                <Text numberOfLines={1} className="text-primary font-extrabold tracking-wider">
                  {coachCode}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => copyText(coachCode)}
                className="px-3 rounded-lg bg-field border border-fieldBorder h-11 items-center justify-center"
              >
                <View className="flex-row items-center gap-1">
                  <MaterialCommunityIcons name="content-copy" size={16} color="#2C2C2C" />
                  <Text className="text-text font-bold">Copy</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={shareCoachCode}
                className="px-3 rounded-lg bg-field border border-fieldBorder h-11 items-center justify-center"
              >
                <View className="flex-row items-center gap-1">
                  <MaterialCommunityIcons name="share-variant" size={16} color="#2C2C2C" />
                  <Text className="text-text font-bold">Share</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={regenerateCoachCode}
                className="px-3 rounded-lg bg-primary h-11 items-center justify-center"
              >
                <View className="flex-row items-center gap-1">
                  <MaterialCommunityIcons name="reload" size={16} color="#0B0F12" />
                  <Text className="text-onPrimary font-extrabold">New</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text className="text-muted mt-2 text-xs">
              Share this code with trainees. They’ll send you a join request using it.
            </Text>

            <View className="mt-4">
              <TouchableOpacity
                onPress={onPressCoachDashboard}
                className="self-start px-4 h-11 rounded-lg bg-field border border-fieldBorder items-center justify-center"
              >
                <Text className="text-text font-bold">Open coach dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Admin-only: Console link */}
        {isAdmin && (
          <View className="mt-4 bg-card rounded-xl border border-border p-4">
            <Text className="text-text font-extrabold mb-1">Admin</Text>
            <Text className="text-muted mb-3">Manage users, requests, and reports.</Text>
            <TouchableOpacity
              onPress={onPressAdminConsole}
              className="self-start px-4 h-11 rounded-lg bg-primary items-center justify-center"
            >
              <Text className="text-onPrimary font-extrabold">Open admin console</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout (all roles) */}
        <View className="mt-4">
          <TouchableOpacity
            onPress={onLogout}
            className="w-full h-11 rounded-lg bg-card border border-border items-center justify-center"
          >
            <Text className="text-text font-bold">Log out</Text>
          </TouchableOpacity>
        </View>

        <View className="h-10" />
      </ScrollView>
            <BottomTabs role={20} currentHref="/(screens)/profile" />
      
    </View>
  );
}
