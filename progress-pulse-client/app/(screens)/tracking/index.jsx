// app/(screens)/tracking/index.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppLogo from "../../../assets/components/ui/AppLogo";
import BookIcon from "../../../assets/images/svg/book.svg";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";

import {
  getTodaySession,
  createSessionFromPlan,
  getSessionView,
  addExerciseToSession,
  addSetToExercise,
  updateSetInExercise,
  removeSetFromExercise,
  closeSession,
} from "../../../assets/api/workouts.api";

const safeAlert = (title, msg = "") => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n${msg}`);
    else console.log("ALERT:", title, msg);
  } else {
    Alert.alert(title, msg);
  }
};

export default function TrackWorkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // keep finish button above BottomTabs
  const TAB_CARD_HEIGHT = 64;
  const TAB_OUTER_MARGIN = 16;
  const EXTRA_GAP = 8;
  const BTN_OFFSET =
    TAB_CARD_HEIGHT + TAB_OUTER_MARGIN + Math.max(insets.bottom, 12) + EXTRA_GAP;

  // auth & plan
  const [token, setToken] = useState("");
  const [planId, setPlanId] = useState("");

  // session (server-backed)
  const [session, setSession] = useState(null); // { _id, status, planned[], exercises[], planDay, ... }
  const [maxMap, setMaxMap] = useState({});     // { exerciseId: maxWeight }
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  // local inputs cache for current sets (so fields edit smoothly)
  // shape: { [exerciseId]: { [setNumber]: { reps, weight } } }
  const [inputs, setInputs] = useState({});

  // selected day is the session.planDay for title context
  const selectedDayId = useMemo(() => session?.planDay ?? 1, [session]);

  // load token & planId
  useEffect(() => {
    (async () => {
      const [t, p] = await AsyncStorage.multiGet(["token", "planId"]);
      setToken(t?.[1] || "");
      setPlanId(p?.[1] || "");
    })();
  }, []);

  // bootstrap: get today's session OR create from plan (ask which day if needed)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const existing = await getTodaySession({ token });
        if (existing) {
          await refreshView(existing._id);
        } else {
          if (!planId) {
            setLoading(false);
            safeAlert("No plan found", "Please build a plan first.");
            router.replace("/(screens)/plan");
            return;
          }
          // simple UX: start from Day 1 by default (or open a small modal to pick)
          const started = await createSessionFromPlan({
            token,
            fromPlanId: planId,
            planDay: 1,
          });
          await refreshView(started._id);
        }
      } catch (e) {
        console.warn("bootstrap session error:", e?.message || e);
        safeAlert("Error", e?.message || "Failed to open session");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, planId]);

  // helper: refresh /view
  const refreshView = useCallback(
    async (sid) => {
      const v = await getSessionView({ token, sessionId: sid });
      setSession(v.session);
      setMaxMap(v.maxByExercise || {});
      // build inputs from session.exercises sets
      const cache = {};
      for (const ex of v.session.exercises || []) {
        cache[String(ex.exerciseId)] = {};
        for (const s of ex.sets || []) {
          cache[String(ex.exerciseId)][s.setNumber] = {
            reps: String(s.reps ?? ""),
            weight: String(s.weight ?? ""),
          };
        }
      }
      setInputs(cache);
    },
    [token]
  );

  // UI helpers
  const plannedList = session?.planned || [];
  const liveList = session?.exercises || [];

  const getLastMax = (exerciseId) => {
    const v = maxMap[String(exerciseId)];
    return v == null ? 0 : Number(v);
  };

  // add exercise (server)
  const handleAddExercise = async (exerciseId) => {
    try {
      const next = await addExerciseToSession({
        token,
        sessionId: session._id,
        exerciseId,
      });
      setSession(next);
      // ensure inputs map exists
      setInputs((prev) => ({
        ...prev,
        [String(exerciseId)]: { ...(prev[String(exerciseId)] || {}) },
      }));
    } catch (e) {
      safeAlert("Error", e?.message || "Failed to add exercise");
    }
  };

  // local input change
  const setInput = (exerciseId, setNumber, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [String(exerciseId)]: {
        ...(prev[String(exerciseId)] || {}),
        [setNumber]: {
          ...(prev[String(exerciseId)]?.[setNumber] || {}),
          [field]: value,
        },
      },
    }));
  };

  // add set (server)
  const handleAddSet = async (exerciseId) => {
    try {
      const reps = 0;
      const weight = 0;
      const updated = await addSetToExercise({
        token,
        sessionId: session._id,
        exerciseId,
        reps,
        weight,
      });
      setSession(updated);
      // make sure inputs reflect new set numbers
      const ex = updated.exercises.find((e) => String(e.exerciseId) === String(exerciseId));
      const cache = { ...(inputs[String(exerciseId)] || {}) };
      for (const s of ex.sets) {
        cache[s.setNumber] = {
          reps: String(s.reps ?? ""),
          weight: String(s.weight ?? ""),
        };
      }
      setInputs((prev) => ({ ...prev, [String(exerciseId)]: cache }));
    } catch (e) {
      safeAlert("Error", e?.message || "Failed to add set");
    }
  };

  // update set (server) — called onBlur (or you can debounce onChange)
  const persistSet = async (exerciseId, setNumber) => {
    try {
      const entry = inputs[String(exerciseId)]?.[setNumber] || {};
      const reps = Number(entry.reps || 0);
      const weight = Number(entry.weight || 0);
      const updated = await updateSetInExercise({
        token,
        sessionId: session._id,
        exerciseId,
        setNumber,
        reps,
        weight,
      });
      setSession(updated);
    } catch (e) {
      safeAlert("Error", e?.message || "Failed to update set");
    }
  };

  // remove set (server)
  const handleRemoveSet = async (exerciseId, setNumber) => {
    try {
      const updated = await removeSetFromExercise({
        token,
        sessionId: session._id,
        exerciseId,
        setNumber,
      });
      setSession(updated);
      // rebuild inputs for that exercise
      const ex = updated.exercises.find((e) => String(e.exerciseId) === String(exerciseId));
      const cache = {};
      for (const s of ex?.sets || []) {
        cache[s.setNumber] = {
          reps: String(s.reps ?? ""),
          weight: String(s.weight ?? ""),
        };
      }
      setInputs((prev) => ({ ...prev, [String(exerciseId)]: cache }));
    } catch (e) {
      safeAlert("Error", e?.message || "Failed to remove set");
    }
  };

  const handleFinishWorkout = async () => {
    if (!session?._id) return;
    try {
      const closed = await closeSession({ token, sessionId: session._id });
      setSession(closed);
      safeAlert("Workout finished!", "Session was closed successfully.");
    } catch (e) {
      safeAlert("Error", e?.message || "Failed to close session");
    }
  };

  const finishDisabled = !session || session.status !== "open";

  // ===== UI =====
  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator />
        <Text className="text-muted mt-2">Loading session…</Text>
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
          headerRight: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open training history"
              onPress={() => router.push("/(screens)/tracking/trainingHistory")}
              className="mr-2 p-2 rounded-xl bg-field border border-fieldBorder"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <BookIcon width={22} height={22} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Title */}
      <View className="px-4 pt-5">
        <Text className="text-text text-2xl font-extrabold">Track Workout</Text>
        <Text className="text-muted mt-1">
          {session?.status === "open"
            ? `Logging sets for Day ${selectedDayId}`
            : "Session is closed."}
        </Text>
      </View>

      {/* summary table (planned) */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: BTN_OFFSET + 80 }}
      >
        <View className="mt-2 bg-card rounded-xl overflow-hidden border border-border">
          <View className="flex-row">
            <View className="flex-1 border-r border-border px-3 py-2">
              <Text className="text-text font-bold underline">Exercise</Text>
            </View>
            <View className="w-20 border-r border-border items-center px-3 py-2">
              <Text className="text-text font-bold">Sets</Text>
            </View>
            <View className="w-28 items-center px-3 py-2">
              <Text className="text-text font-bold">Max (kg)</Text>
            </View>
          </View>

          {(plannedList || []).map((p) => (
            <View key={String(p.exerciseId)} className="flex-row border-t border-border">
              <View className="flex-1 px-3 py-3 border-r border-border">
                <Text className="text-text">#{String(p.exerciseId).slice(-6)}</Text>
              </View>
              <View className="w-20 items-center justify-center border-r border-border">
                <Text className="text-muted">#{p.sets}</Text>
              </View>
              <View className="w-28 items-center justify-center">
                <Text className="text-text font-bold">{getLastMax(p.exerciseId)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* add exercise + log table */}
        <View className="mt-4 bg-card rounded-xl border border-border">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-text font-extrabold">Add exercise</Text>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              className="p-2 rounded-lg bg-field border border-fieldBorder"
              disabled={session?.status !== "open"}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#007BFF" />
            </TouchableOpacity>
          </View>

          {/* hint */}
          <View className="px-4 pb-1 -mt-2">
            <View className="self-start flex-row items-center gap-1.5 px-2 py-1 rounded-full bg-field border border-fieldBorder">
              <MaterialCommunityIcons name="gesture-swipe-horizontal" size={14} color="#667085" />
              <Text className="text-[12px] text-muted">Swipe left/right to see all columns</Text>
            </View>
          </View>

          <View className="border-t border-border">
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{ minWidth: 240 + 72 + 96 + 96 + 48 }}>
                {/* header */}
                <View className="flex-row bg-field border-b border-fieldBorder">
                  <View className="px-3 py-2 border-r border-fieldBorder" style={{ minWidth: 240, flexGrow: 1 }}>
                    <Text className="text-text font-bold">Exercise</Text>
                  </View>
                  <View className="items-center px-3 py-2 border-r border-fieldBorder" style={{ width: 72 }}>
                    <Text className="text-text font-bold">Set</Text>
                  </View>
                  <View className="items-center px-3 py-2 border-r border-fieldBorder" style={{ width: 96 }}>
                    <Text className="text-text font-bold">Reps</Text>
                  </View>
                  <View className="items-center px-3 py-2 border-r border-fieldBorder" style={{ width: 96 }}>
                    <Text className="text-text font-bold">Weight</Text>
                  </View>
                  <View className="items-center px-1 py-2" style={{ width: 48 }} />
                </View>

                {/* rows from live session.exercises */}
                {(liveList || []).length === 0 ? (
                  <Text className="text-muted px-4 py-3">No exercises added yet.</Text>
                ) : (
                  liveList.map((ex) => (
                    <View key={String(ex.exerciseId)} className="border-t border-border">
                      {(ex.sets || []).map((s) => (
                        <View key={s.setNumber} className="flex-row items-stretch">
                          <View className="px-3 py-3 border-r border-border" style={{ minWidth: 240, flexGrow: 1 }}>
                            <Text className="text-text">
                              #{String(ex.exerciseId).slice(-6)}
                            </Text>
                          </View>

                          <View className="items-center justify-center border-r border-border" style={{ width: 72 }}>
                            <Text className="text-text">set {s.setNumber}</Text>
                          </View>

                          <View className="justify-center border-r border-border px-2 py-2" style={{ width: 96 }}>
                            <TextInput
                              value={inputs[String(ex.exerciseId)]?.[s.setNumber]?.reps ?? ""}
                              onChangeText={(v) => setInput(ex.exerciseId, s.setNumber, "reps", v.replace(/[^0-9]/g, ""))}
                              onBlur={() => persistSet(ex.exerciseId, s.setNumber)}
                              keyboardType="numeric"
                              inputMode="numeric"
                              placeholder="0"
                              placeholderTextColor="#667085"
                              className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-10"
                              editable={session?.status === "open"}
                            />
                          </View>

                          <View className="justify-center border-r border-border px-2 py-2" style={{ width: 96 }}>
                            <TextInput
                              value={inputs[String(ex.exerciseId)]?.[s.setNumber]?.weight ?? ""}
                              onChangeText={(v) =>
                                setInput(ex.exerciseId, s.setNumber, "weight", v.replace(/[^0-9.]/g, ""))
                              }
                              onBlur={() => persistSet(ex.exerciseId, s.setNumber)}
                              keyboardType="numeric"
                              inputMode="decimal"
                              placeholder="0"
                              placeholderTextColor="#667085"
                              className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-10"
                              editable={session?.status === "open"}
                            />
                          </View>

                          <View className="items-center justify-center px-1" style={{ width: 48 }}>
                            <TouchableOpacity
                              onPress={() => handleRemoveSet(ex.exerciseId, s.setNumber)}
                              className="px-2 py-1 rounded-md bg-field border border-fieldBorder"
                              accessibilityLabel={`Remove set ${s.setNumber}`}
                              disabled={session?.status !== "open"}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#2C2C2C" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      <View className="flex-row border-t border-border">
                        <View className="border-r border-border" style={{ minWidth: 240, flexGrow: 1 }} />
                        <TouchableOpacity
                          onPress={() => handleAddSet(ex.exerciseId)}
                          className="items-center justify-center border-r border-border"
                          style={{ width: 72 }}
                          disabled={session?.status !== "open"}
                        >
                          <Text className="text-primary font-bold">+ set</Text>
                        </TouchableOpacity>
                        <View className="border-r border-border" style={{ width: 96 }} />
                        <View className="border-r border-border" style={{ width: 96 }} />
                        <View style={{ width: 48 }} />
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>

        <View className="h-28" />
      </ScrollView>

      {/* Finish button */}
      <View style={{ position: "absolute", left: 16, right: 16, bottom: BTN_OFFSET }}>
        <TouchableOpacity
          disabled={finishDisabled}
          onPress={handleFinishWorkout}
          className={`h-12 rounded-xl items-center justify-center ${
            finishDisabled ? "bg-card opacity-60" : "bg-primary"
          }`}
        >
          <Text className={`${finishDisabled ? "text-muted" : "text-onPrimary font-extrabold"}`}>
            {session?.status === "open" ? "Finish Workout" : "Session Closed"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Picker — מתוך planned */}
      <Modal visible={pickerOpen} animationType="fade" transparent onRequestClose={() => setPickerOpen(false)}>
        <View className="flex-1 bg-black/60 items-center justify-center px-4">
          <View className="w-full max-w-[560px] rounded-2xl bg-card border border-border p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary text-lg font-extrabold">Pick exercise — Day {selectedDayId}</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} className="px-3 py-1 rounded-lg bg-field border border-fieldBorder">
                <Text className="text-text font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[70vh]">
              <View className="bg-bg rounded-xl overflow-hidden border border-border">
                {(plannedList || []).map((p, i) => {
                  const already = (liveList || []).some((e) => String(e.exerciseId) === String(p.exerciseId));
                  return (
                    <TouchableOpacity
                      key={String(p.exerciseId)}
                      disabled={already || session?.status !== "open"}
                      onPress={async () => {
                        await handleAddExercise(p.exerciseId);
                        setPickerOpen(false);
                      }}
                      className={`px-3 py-3 ${i > 0 ? "border-t border-border" : ""} ${
                        already ? "opacity-50" : "active:opacity-80"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-text">#{String(p.exerciseId).slice(-6)}</Text>
                        <Text className="text-muted text-xs">planned: {p.sets} • max {getLastMax(p.exerciseId)}kg</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tabs */}
      <BottomTabs role={20} currentHref="/(screens)/tracking" />
    </View>
  );
}
