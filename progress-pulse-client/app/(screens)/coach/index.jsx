// app/(screens)/coach/index.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Platform,
  Share,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppLogo from "../../../assets/components/ui/AppLogo";

/* ===== Demo data ===== */
const DEMO_SUBSCRIBERS = [
  { id: "u101", name: "Ava Johnson",  email: "ava.johnson@example.com",  avatarUrl: "", since: "2025-07-12", lastWorkoutDate: "2025-08-30", status: "approved" },
  { id: "u102", name: "Ben Carter",   email: "ben.carter@example.com",   avatarUrl: "", since: "2025-06-03", lastWorkoutDate: "2025-08-27", status: "approved" },
  { id: "u105", name: "Ella Rossi",   email: "ella.rossi@example.com",   avatarUrl: "", since: "2025-04-11", lastWorkoutDate: "2025-08-19", status: "approved" },
];

const DEMO_REQUESTS = [
  { id: "u201", name: "Frank Miller", email: "frank.miller@example.com", avatarUrl: "", requestedOn: "2025-08-29" },
  { id: "u202", name: "Grace Park",   email: "grace.park@example.com",   avatarUrl: "", requestedOn: "2025-08-28" },
];

/* ===== Helpers ===== */
const formatDateEN = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
  } catch {
    const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
};
const todayISO = () => new Date().toISOString().slice(0, 10);

const confirmAction = async (title, message) => {
  if (Platform.OS === "web") return window.confirm(`${title}\n${message}`);
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "OK", onPress: () => resolve(true) },
    ]);
  });
};

async function copyToClipboard(text) {
  try {
    if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      alert("Code copied");
      return;
    }
  } catch {}
  Alert.alert("Coach code", text);
}

/* ===== Coach Code Card (wrap-friendly) ===== */
function CoachCodeCard({ coachCode, onRegenerate }) {
  const onShare = async () => {
    const message = `Join my coaching on Progress Pulse.\nCoach code: ${coachCode}`;
    try {
      if (Platform.OS === "web") {
        if (navigator?.share) await navigator.share({ title: "Coach Code", text: message });
        else alert(message);
      } else {
        await Share.share({ message });
      }
    } catch {}
  };

  return (
    <View className="bg-card rounded-xl border border-border px-4 py-3 mb-3">
      <Text className="text-text font-extrabold mb-2">Your coach code</Text>

      <View className="flex-row flex-wrap gap-2 items-stretch">
        <View className="flex-row items-center px-3 rounded-lg bg-field border border-fieldBorder h-11 flex-1">
          <Text numberOfLines={1} className="text-primary font-extrabold tracking-wider">
            {coachCode}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => copyToClipboard(coachCode)}
          className="px-3 rounded-lg bg-field border border-fieldBorder h-11 items-center justify-center"
        >
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons name="content-copy" size={16} color="#2C2C2C" />
            <Text className="text-text font-bold">Copy</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShare}
          className="px-3 rounded-lg bg-field border border-fieldBorder h-11 items-center justify-center"
        >
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons name="share-variant" size={16} color="#2C2C2C" />
            <Text className="text-text font-bold">Share</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRegenerate}
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
    </View>
  );
}

/* ===== Screen ===== */
export default function CoachScreen() {
  const router = useRouter();

  const [subs, setSubs] = useState(DEMO_SUBSCRIBERS);
  const [requests, setRequests] = useState(DEMO_REQUESTS);
  const [coachCode, setCoachCode] = useState("FITSAM-4821");

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("approved"); // 'approved' | 'requests'
  const [refreshing, setRefreshing] = useState(false);

  const counts = {
    approved: subs.filter((s) => s.status === "approved").length,
    requests: requests.length,
  };

  const listSubscribers = useMemo(() => {
    const base = subs.filter((s) => s.status === "approved");
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      : base;
    return [...filtered].sort((a, b) => {
      const da = a.lastWorkoutDate ? new Date(a.lastWorkoutDate).getTime() : 0;
      const db = b.lastWorkoutDate ? new Date(b.lastWorkoutDate).getTime() : 0;
      if (db !== da) return db - da;
      return a.name.localeCompare(b.name);
    });
  }, [subs, query]);

  const listRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? requests.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
      : requests;
    return [...filtered].sort(
      (a, b) => new Date(b.requestedOn).getTime() - new Date(a.requestedOn).getTime()
    );
  }, [requests, query]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  };

  const goToHistory = (s) => {
    router.push({
      pathname: "/(screens)/tracking/training history",
      params: { userId: s.id, userName: s.name },
    });
  };

  const approveRequest = async (r) => {
    const ok = await confirmAction("Approve subscriber?", `Approve ${r.name} to join?`);
    if (!ok) return;
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
    setSubs((prev) => [
      ...prev,
      { id: r.id, name: r.name, email: r.email, avatarUrl: r.avatarUrl || "", since: todayISO(), lastWorkoutDate: null, status: "approved" },
    ]);
  };

  const declineRequest = async (r) => {
    const ok = await confirmAction("Decline request?", `Decline ${r.name}'s request?`);
    if (!ok) return;
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
  };

  const regenerateCode = () => {
    const rnd = Math.floor(1000 + Math.random() * 9000);
    setCoachCode(`FITSAM-${rnd}`);
  };

  const RowBadge = ({ label }) => (
    <View className="px-3 py-1 rounded-full bg-primary/90">
      <Text className="text-onPrimary font-extrabold text-xs">{label}</Text>
    </View>
  );

  const SubscriberCard = ({ s }) => (
    <TouchableOpacity
      onPress={() => goToHistory(s)}
      activeOpacity={0.9}
      className="bg-card rounded-xl border border-border p-4"
    >
      <View className="flex-row gap-3">
        {s.avatarUrl ? (
          <Image source={{ uri: s.avatarUrl }} className="w-12 h-12 rounded-full" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-field border border-fieldBorder items-center justify-center">
            <Text className="text-primary font-extrabold">
              {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="text-text font-bold text-base flex-1 pr-3">{s.name}</Text>
            <RowBadge label="approved" />
          </View>

          <Text className="text-muted mt-0.5">{s.email}</Text>

          <View className="flex-row flex-wrap gap-x-6 gap-y-1 mt-2">
            <Text className="text-[#6B7280]">
              Since: <Text className="text-text font-bold">{formatDateEN(s.since)}</Text>
            </Text>
            <Text className="text-[#6B7280]">
              Last workout:{" "}
              <Text className="text-text font-bold">
                {s.lastWorkoutDate ? formatDateEN(s.lastWorkoutDate) : "—"}
              </Text>
            </Text>
          </View>

          <View className="mt-3">
            <TouchableOpacity
              onPress={() => goToHistory(s)}
              className="self-start px-3 py-1.5 rounded-lg bg-field border border-fieldBorder"
            >
              <Text className="text-text font-bold text-xs">View history</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const RequestCard = ({ r }) => (
    <View className="bg-card rounded-xl border border-border p-4">
      <View className="flex-row gap-3">
        {r.avatarUrl ? (
          <Image source={{ uri: r.avatarUrl }} className="w-12 h-12 rounded-full" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-field border border-fieldBorder items-center justify-center">
            <Text className="text-primary font-extrabold">
              {r.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-text font-bold text-base">{r.name}</Text>
          <Text className="text-muted">{r.email}</Text>
          <Text className="text-[#6B7280] mt-2">
            Requested on: <Text className="text-text font-bold">{formatDateEN(r.requestedOn)}</Text>
          </Text>

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity onPress={() => approveRequest(r)} className="px-3 py-2 rounded-lg bg-primary">
              <Text className="text-onPrimary font-extrabold text-xs">Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => declineRequest(r)} className="px-3 py-2 rounded-lg bg-field border border-fieldBorder">
              <Text className="text-text font-bold text-xs">Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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

      <View className="px-4 pt-4">
        <Text className="text-text text-2xl font-extrabold">Subscribers</Text>
        <Text className="text-muted mt-1">Manage your trainees and pending requests.</Text>

        <CoachCodeCard coachCode={coachCode} onRegenerate={regenerateCode} />

        <View className="bg-card rounded-xl border border-border px-4 py-3">
          <Text className="text-text font-bold mb-2">Search</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or email"
            placeholderTextColor="#667085"
            className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
          />

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => setActiveTab("approved")}
              className={`px-3 py-2 rounded-lg border ${activeTab === "approved" ? "bg-primary border-primary" : "bg-field border-fieldBorder"}`}
            >
              <Text className={activeTab === "approved" ? "text-onPrimary font-extrabold" : "text-text"}>
                Approved ({counts.approved})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("requests")}
              className={`px-3 py-2 rounded-lg border ${activeTab === "requests" ? "bg-primary border-primary" : "bg-field border-fieldBorder"}`}
            >
              <Text className={activeTab === "requests" ? "text-onPrimary font-extrabold" : "text-text"}>
                Requests ({counts.requests})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007BFF" />}
      >
        <View className="py-4 space-y-3">
          {activeTab === "requests" ? (
            listRequests.length === 0 ? (
              <Text className="text-muted text-center mt-8">No pending requests.</Text>
            ) : (
              listRequests.map((r) => <RequestCard key={r.id} r={r} />)
            )
          ) : listSubscribers.length === 0 ? (
            <Text className="text-muted text-center mt-8">No subscribers found.</Text>
          ) : (
            listSubscribers.map((s) => <SubscriberCard key={s.id} s={s} />)
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
