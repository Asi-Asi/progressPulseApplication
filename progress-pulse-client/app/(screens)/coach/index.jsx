// app/(screens)/coach/subscribers.jsx
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
} from "react-native";
import { Stack, useRouter } from "expo-router";

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

export default function Subscribers() {
  const router = useRouter();

  // Demo state
  const [subs, setSubs] = useState(DEMO_SUBSCRIBERS);
  const [requests, setRequests] = useState(DEMO_REQUESTS);

  // UI state
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("approved"); // 'approved' | 'all' | 'requests'
  const [refreshing, setRefreshing] = useState(false);

  const counts = {
    approved: subs.filter((s) => s.status === "approved").length,
    all: subs.length,
    requests: requests.length,
  };

  /* ===== Derived lists by tab ===== */
  const listSubscribers = useMemo(() => {
    const base = activeTab === "approved" ? subs.filter((s) => s.status === "approved") : subs;
    const q = query.trim().toLowerCase();
    const filtered = q ? base.filter((s) =>
      s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    ) : base;
    return [...filtered].sort((a, b) => {
      const da = a.lastWorkoutDate ? new Date(a.lastWorkoutDate).getTime() : 0;
      const db = b.lastWorkoutDate ? new Date(b.lastWorkoutDate).getTime() : 0;
      if (db !== da) return db - da;
      return a.name.localeCompare(b.name);
    });
  }, [subs, query, activeTab]);

  const listRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? requests.filter((r) =>
      r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    ) : requests;
    return [...filtered].sort(
      (a, b) => new Date(b.requestedOn).getTime() - new Date(a.requestedOn).getTime()
    );
  }, [requests, query]);

  /* ===== Actions ===== */
  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500)); // simulate
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
    // optionally switch tab automatically to 'approved'
    // setActiveTab('approved');
  };

  const declineRequest = async (r) => {
    const ok = await confirmAction("Decline request?", `Decline ${r.name}'s request?`);
    if (!ok) return;
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
  };

  /* ===== Cards ===== */
  const SubscriberCard = ({ s }) => (
    <TouchableOpacity onPress={() => goToHistory(s)} activeOpacity={0.9} className="bg-[#2B2B2B] rounded-xl border border-[#000]/40 p-4">
      <View className="flex-row items-center">
        {s.avatarUrl ? (
          <Image source={{ uri: s.avatarUrl }} className="w-12 h-12 rounded-full" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-[#333533] items-center justify-center">
            <Text className="text-[#FFD100] font-extrabold">
              {s.name.split(" ").map((p) => p[0]).join("").slice(0,2).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1 ml-3">
          <Text className="text-[#F4F4F4] font-bold">{s.name}</Text>
          <Text className="text-[#9AA0A6]">{s.email}</Text>

          <View className="flex-row gap-4 mt-2">
            <Text className="text-[#CFCFCF]">
              Since: <Text className="text-[#F4F4F4] font-bold">{formatDateEN(s.since)}</Text>
            </Text>
            <Text className="text-[#CFCFCF]">
              Last workout: <Text className="text-[#F4F4F4] font-bold">{s.lastWorkoutDate ? formatDateEN(s.lastWorkoutDate) : "—"}</Text>
            </Text>
          </View>
        </View>

        <View className="items-end">
          <View className="px-3 py-1 rounded-full bg-[#00A896]">
            <Text className="text-[#0B0F12] font-extrabold text-xs">approved</Text>
          </View>
          <TouchableOpacity onPress={() => goToHistory(s)} className="mt-3 px-3 py-1 rounded-lg bg-[#FFD100]">
            <Text className="text-[#0B0F12] font-extrabold text-xs">View history</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const RequestCard = ({ r }) => (
    <View className="bg-[#2B2B2B] rounded-xl border border-[#000]/40 p-4">
      <View className="flex-row items-center">
        {r.avatarUrl ? (
          <Image source={{ uri: r.avatarUrl }} className="w-12 h-12 rounded-full" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-[#333533] items-center justify-center">
            <Text className="text-[#FFD100] font-extrabold">
              {r.name.split(" ").map((p) => p[0]).join("").slice(0,2).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1 ml-3">
          <Text className="text-[#F4F4F4] font-bold">{r.name}</Text>
          <Text className="text-[#9AA0A6]">{r.email}</Text>
          <Text className="text-[#CFCFCF] mt-2">
            Requested on: <Text className="text-[#F4F4F4] font-bold">{formatDateEN(r.requestedOn)}</Text>
          </Text>
        </View>

        <View className="items-end gap-2">
          <TouchableOpacity onPress={() => approveRequest(r)} className="px-3 py-2 rounded-lg bg-[#FFD100]">
            <Text className="text-[#0B0F12] font-extrabold text-xs">Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => declineRequest(r)} className="px-3 py-2 rounded-lg bg-[#3b3b3b]">
            <Text className="text-white font-bold text-xs">Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /* ===== Render ===== */
  return (
    <View className="flex-1 bg-[#1E1E1E]">
      <Stack.Screen
        options={{
          title: "Subscribers",
          headerStyle: { backgroundColor: "#1E1E1E" },
          headerTintColor: "#FFD100",
          headerTitleStyle: { fontWeight: "bold", fontSize: 22 },
        }}
      />

      {/* Search + Tabs */}
      <View className="px-4 pt-4">
        <View className="bg-[#2B2B2B] rounded-xl border border-[#000]/40 px-4 py-3">
          <Text className="text-[#F4F4F4] font-bold mb-2">Search</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or email"
            placeholderTextColor="#666"
            className="bg-[#1F2937] text-white rounded-lg px-3 h-11"
          />

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => setActiveTab("approved")}
              className={`px-3 py-2 rounded-lg border ${activeTab === "approved" ? "bg-[#FFD100] border-[#FFD100]" : "bg-[#333533] border-[#000]/40"}`}
            >
              <Text className={activeTab === "approved" ? "text-[#0B0F12] font-extrabold" : "text-[#F4F4F4]"}>
                Approved ({counts.approved})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("all")}
              className={`px-3 py-2 rounded-lg border ${activeTab === "all" ? "bg-[#FFD100] border-[#FFD100]" : "bg-[#333533] border-[#000]/40"}`}
            >
              <Text className={activeTab === "all" ? "text-[#0B0F12] font-extrabold" : "text-[#F4F4F4]"}>
                All ({counts.all})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("requests")}
              className={`px-3 py-2 rounded-lg border ${activeTab === "requests" ? "bg-[#FFD100] border-[#FFD100]" : "bg-[#333533] border-[#000]/40"}`}
            >
              <Text className={activeTab === "requests" ? "text-[#0B0F12] font-extrabold" : "text-[#F4F4F4]"}>
                Requests ({counts.requests})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Body by tab */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD100" />}
      >
        <View className="py-4 space-y-3">
          {activeTab === "requests" ? (
            listRequests.length === 0 ? (
              <Text className="text-[#9AA0A6] text-center mt-8">No pending requests.</Text>
            ) : (
              listRequests.map((r) => <RequestCard key={r.id} r={r} />)
            )
          ) : (
            listSubscribers.length === 0 ? (
              <Text className="text-[#9AA0A6] text-center mt-8">No subscribers found.</Text>
            ) : (
              listSubscribers.map((s) => <SubscriberCard key={s.id} s={s} />)
            )
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
