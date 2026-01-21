// app/(screens)/coach/index.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import AppLogo from "../../../assets/components/ui/AppLogo";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";
import { formatDateEN, confirmAction } from "../../../assets/components/screens/coach/coach.helpers";

import {
  getCoachCode, rotateCoachCode,
  listJoinRequests, approveJoinRequest, rejectJoinRequest,
  listSubscribers as apiListSubscribers, revokeSubscriber,
  getTraineeHistory, getTraineeWorkout  
} from "../../../assets/api/coach.api";

import { listHistory, getWorkoutById } from "../../../assets/api/workouts.api";

// Extracted components
import CoachCodeCard from "../../../assets/components/screens/coach/CoachCodeCard";
import SubscriberCard from "../../../assets/components/screens/coach/SubscriberCard";
import RequestCard from "../../../assets/components/screens/coach/RequestCard";

/* ===== View mappers (Server → UI) ===== */
const mapSubscriber = (link) => ({
  _linkId: link._id,                                  // for revoke
  id: String(link.traineeId),                         // for history navigation
  name: link.traineeName || link.traineeEmail || String(link.traineeId).slice(-6),
  email: link.traineeEmail || "",
  avatarUrl: link.traineeAvatarUrl || "",
  since: link.createdAt || null,
  lastWorkoutDate: link.lastWorkoutDate || null,
  status: link.status,
});

const mapRequest = (link) => ({
  _linkId: link._id,                                  // for approve/reject
  id: String(link.traineeId),
  name: link.traineeName || link.traineeEmail || String(link.traineeId).slice(-6),
  email: link.traineeEmail || "",
  avatarUrl: link.traineeAvatarUrl || "",
  requestedOn: link.createdAt || null,
});

/* ===== Screen ===== */
export default function CoachScreen() {
  const router = useRouter();

  const [subs, setSubs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [coachCode, setCoachCode] = useState(null);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("approved"); // 'approved' | 'requests'
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const counts = {
    approved: subs.filter((s) => s.status === "approved").length,
    requests: requests.length,
  };

  // Load from API
  const loadAll = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      else setRefreshing(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) throw new Error("Missing access token");

      const [codeResp, reqResp, subResp] = await Promise.all([
        getCoachCode({ token }),
        listJoinRequests({ token, limit: 20, skip: 0 }),
        apiListSubscribers({ token, limit: 20, skip: 0 }),
      ]);

      setCoachCode(codeResp?.code ?? null);
      setRequests((reqResp?.items || []).map(mapRequest));
      setSubs((subResp?.items || []).map(mapSubscriber));
    } catch (e) {
      const msg = e?.payload?.message || e?.message || "Failed to load coach data";
      Alert.alert("Error", msg);
    } finally {
      if (isInitial) setInitialLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(true); }, [loadAll]);

  // Derived UI lists
  const subsView = useMemo(() => {
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

  const requestsView = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? requests.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
      : requests;
    return [...filtered].sort(
      (a, b) => new Date(b.requestedOn || 0).getTime() - new Date(a.requestedOn || 0).getTime()
    );
  }, [requests, query]);

  const onRefresh = async () => { await loadAll(); };

  const goToHistory = (s) => {
    router.push({
      pathname: "/(screens)/tracking/trainingHistory",
      params: { traineeId: s.id, traineeName: s.name },
    });
  };

  /* ===== Server Actions ===== */
  const approveRequestFn = async (r) => {
    const ok = await confirmAction("Approve subscriber?", `Approve ${r.name} to join?`);
    if (!ok) return;
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await approveJoinRequest({ token, linkId: r._linkId });
      await loadAll();
    } catch (e) {
      const status = e?.status;
      const msg = e?.payload?.message || (status === 409 ? "Already approved" : "Approve failed");
      Alert.alert("Error", msg);
    }
  };

  const declineRequestFn = async (r) => {
    const ok = await confirmAction("Decline request?", `Decline ${r.name}'s request?`);
    if (!ok) return;
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await rejectJoinRequest({ token, linkId: r._linkId });
      await loadAll();
    } catch (e) {
      const status = e?.status;
      const msg = e?.payload?.message || (status === 409 ? "Already rejected" : "Reject failed");
      Alert.alert("Error", msg);
    }
  };

  const regenerateCode = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Session", "Missing token. Please log in again.");
        return;
      }
      const { code } = await rotateCoachCode({ token });
      setCoachCode(code);
      Alert.alert("New coach code", code);
    } catch (e) {
      const status = e?.status;
      const msg = e?.payload?.message || (status === 401 ? "Session expired. Please log in." : "Failed to rotate code");
      Alert.alert("Error", msg);
    }
  };

  const revokeFn = async (s) => {
    const ok = await confirmAction("Revoke subscriber?", `Revoke ${s.name}?`);
    if (!ok) return;
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await revokeSubscriber({ token, linkId: s._linkId });
      await loadAll();
    } catch (e) {
      const status = e?.status;
      const msg = e?.payload?.message || (status === 409 ? "Already revoked" : "Revoke failed");
      Alert.alert("Error", msg);
    }
  };


  if (initialLoading) {
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
          <ActivityIndicator size="large" />
          <Text className="text-muted mt-3">Loading coach data…</Text>
        </View>
      </View>
    );
  }
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
            requestsView.length === 0 ? (
              <Text className="text-muted text-center mt-8">No pending requests.</Text>
            ) : (
              requestsView.map((r) => (
                <RequestCard
                  key={r._linkId}
                  r={r}
                  onApprove={approveRequestFn}
                  onDecline={declineRequestFn}
                  formatDateEN={formatDateEN}
                />
              ))
            )
          ) : subsView.length === 0 ? (
            <Text className="text-muted text-center mt-8">No subscribers found.</Text>
          ) : (
            subsView.map((s) => (
              <SubscriberCard
                key={s._linkId}
                s={s}
                onViewHistory={goToHistory}
                onRevoke={revokeFn}
                formatDateEN={formatDateEN}
              />
            ))
          )}
        </View>

        <View className="h-8" />
      </ScrollView>

      <BottomTabs role={30} currentHref="/(screens)/coach" />
    </View>
  );
}
