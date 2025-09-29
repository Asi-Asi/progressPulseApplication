// app/(screens)/tracking/index.jsx
import React, { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator  } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppLogo from "../../../assets/components/ui/AppLogo";
import BookIcon from "../../../assets/images/svg/book.svg";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyPlan } from "../../../assets/api/plan.api";
import {
  getTodaySession, createSession, getSessionView,
  addExercise as apiAddExercise, removeExercise as apiRemoveExercise,
  addSet as apiAddSet, updateSet as apiUpdateSet, removeSet as apiRemoveSet,
  closeSession as apiCloseSession,
} from "../../../assets/api/workouts.api";

import { safeAlert } from "../../../assets/utils/tracking";

import DayPicker from "../../../assets/components/screens/tracking/DayPicker";
import SummaryTable from "../../../assets/components/screens/tracking/SummaryTable";
import LogTable from "../../../assets/components/screens/tracking/LogTable";
import ExercisePickerModal from "../../../assets/components/screens/tracking/ExercisePickerModal";
import FinishButton from "../../../assets/components/screens/tracking/FinishButton";

// ===== Screen =====
export default function TrackWorkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Auth + server models
  const [token, setToken] = useState("");
  const [planMeta, setPlanMeta] = useState(null);      // { _id, days:[{ dayNumber, exercises:[{exerciseId,sets}] }], locked? }
  const [session, setSession] = useState(null);        // current open/closed session doc
  const [maxByExercise, setMaxByExercise] = useState({}); // from /view

  // UI state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState(null); 
  const [starting, setStarting] = useState(false);          // ספינר בזמן פתיחה
  const [showPicker, setShowPicker] = useState(true);       // הסתרת ה-DayPicker אחרי START

  // Load token
  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("accessToken");
      setToken(t || "");
    })();
  }, []);

  // Load plan + today's session when token is ready
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const p = await getMyPlan({ token });

        const planId = p?._id || p?.planId || p?.id;
        setPlanMeta(planId ? { ...p, _id: planId } : p);



      } catch {
        setPlanMeta(null);
      }

      try {
        const s = await getTodaySession({ token });
        setSession(s || null);
        // אם יש סשן פתוח – לא בוחרים ולא מסתירים. רק נשמור אותו ונציג כפתור Resume.
        setShowPicker(true);
      } catch {
        setSession(null);
        setShowPicker(true);
      }
    })();
  }, [token]);

  // Build UI “days” adapter from planMeta
  const uiDays = useMemo(() => {
    const src = planMeta?.days ?? [];
    return src.map((day) => {
      const arr = day.items ?? day.exercises ?? [];      // <-- הכי חשוב
      const dayNum = day.dayNumber ?? day.day;
      return {
        id: String(dayNum),
        name: `Day ${dayNum}`,
        exercises: arr.map((it) => ({
          id: String(it.exerciseId),
          name: it.name ?? `Exercise ${String(it.exerciseId).slice(-4)}`,
          sets: it.sets ?? 0,
          lastMaxKg: maxByExercise[String(it.exerciseId)] ?? 0,
        })),
      };
    });
  }, [planMeta, maxByExercise]);

  const currentDay = useMemo(
    () => uiDays.find((d) => d.id === String(selectedDayId)) || null,
    [uiDays, selectedDayId]
  );

  // ==== API helpers ====
  async function refreshView(sessionId = session?._id) {
    if (!token || !sessionId) return;
    try {
      const { session: sess, maxByExercise: pr } = await getSessionView({ token, sessionId });
      setSession(sess);
      setMaxByExercise(pr || {});
    } catch (e) {
    }
  }

  async function onStartSessionForDay(dayNumber) {
    if (!token) return safeAlert("Missing token");
    const planId = planMeta?._id || planMeta?.planId || planMeta?.id;
    if (!planId) return safeAlert("Missing plan", "Finish your plan first.");
    try {
      setStarting(true);
      setShowPicker(false); 
      const s = await createSession({ token, fromPlanId: planId, planDay: dayNumber });
      setSession(s);
      await refreshView(s._id);
    } catch (e) {
      setShowPicker(true);
      safeAlert("Start failed", e?.message || "Failed to start session");

    } finally {
      setStarting(false);   
    }
    
  }

  async function onAddExercise(exerciseId) {
    try {
      const updated = await apiAddExercise({ token, sessionId: session._id, exerciseId });
      setSession(updated);
    } catch (e) { safeAlert("Add exercise failed", e?.message || ""); }
  }

  async function onRemoveExercise(exerciseId) {
    try {
      const updated = await apiRemoveExercise({ token, sessionId: session._id, exerciseId });
      setSession(updated);
    } catch (e) { safeAlert("Remove exercise failed", e?.message || ""); }
  }

  async function onAddSet(exerciseId) {
    try {
      const updated = await apiAddSet({ token, sessionId: session._id, exerciseId, reps: 0, weight: 0 });
      setSession(updated);
    } catch (e) { safeAlert("Add set failed", e?.message || ""); }
  }

  async function onUpdateSet(exerciseId, setNumber1based, reps, weight) {
    try {
      const updated = await apiUpdateSet({
        token, sessionId: session._id, exerciseId,
        setNumber: setNumber1based, reps, weight
      });
      setSession(updated);
    } catch (e) { safeAlert("Update set failed", e?.message || ""); }
  }

  async function onRemoveSet(exerciseId, setNumber1based) {
    try {
      const updated = await apiRemoveSet({ token, sessionId: session._id, exerciseId, setNumber: setNumber1based });
      setSession(updated);
    } catch (e) { safeAlert("Remove set failed", e?.message || ""); }
  }

  async function onFinish() {
    try {
      const closed = await apiCloseSession({ token, sessionId: session._id });
      setSession(closed); // status: 'closed'
      safeAlert("Workout finished", "Saved to history.");
    } catch (e) { safeAlert("Finish failed", e?.message || ""); }
  }


  // keep the button above BottomTabs
  const TAB_CARD_HEIGHT = 64;
  const TAB_OUTER_MARGIN = 16;
  const EXTRA_GAP = 8;
  const BTN_OFFSET = TAB_CARD_HEIGHT + TAB_OUTER_MARGIN + Math.max(insets.bottom, 12) + EXTRA_GAP;

  const selectedSession = useMemo(
    () => (session && String(session.planDay) === String(selectedDayId) ? session : null),
    [session, selectedDayId]
  );

  const finishDisabled = !selectedSession || (selectedSession.exercises || []).length === 0;


// השוואה בין יום שנבחר לסשן פתוח
useEffect(() => {
  const match = session && String(session.planDay) === String(selectedDayId);
  console.log("[TRACK] session check => planDay:", session?.planDay, "| selectedDayId:", selectedDayId, "| match:", match);
}, [session, selectedDayId]);

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
        <Text className="text-muted mt-1">Log sets and weights for today’s session.</Text>
      </View>

      {/* Day picker (from plan) */}
      {(!selectedSession && showPicker) && (
        <>
          <DayPicker
            days={uiDays}
            selectedDayId={String(selectedDayId || "")}
            onSelect={setSelectedDayId}
          />

          <View className="px-4 pt-4">
            {session?.status === "open" ? (
              <TouchableOpacity
                disabled={starting}
                onPress={async () => {
                  try {
                    setStarting(true);
                    setSelectedDayId(String(session.planDay)); // נבחר רק עכשיו
                    setShowPicker(false);                      // נסגור רק עכשיו
                    await refreshView(session._id);            // נטען את הלוג
                  } finally {
                    setStarting(false);
                  }
                }}
                className={`rounded-xl px-4 py-3 ${starting ? "bg-card opacity-60" : "bg-primary"}`}
              >
                {starting ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" />
                    <Text className="text-text font-extrabold ml-2">Resuming…</Text>
                  </View>
                ) : (
                  <Text className="text-onPrimary font-extrabold">
                    Resume session — Day {session?.planDay}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                disabled={!selectedDayId || starting}
                onPress={() => onStartSessionForDay(Number(selectedDayId))}
                className={`rounded-xl px-4 py-3 ${(!selectedDayId || starting) ? "bg-card opacity-60" : "bg-primary"}`}
              >
                {starting ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" />
                    <Text className="text-text font-extrabold ml-2">Starting…</Text>
                  </View>
                ) : (
                  <Text className="text-onPrimary font-extrabold">
                    {selectedDayId ? `Start session for Day ${selectedDayId}` : "Pick a day to start"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}   

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 64 + 16 + Math.max(insets.bottom, 12) + 8 + 80 }}
      >
        <SummaryTable day={currentDay} maxByExercise={maxByExercise} />

        {/* Add exercise + log */}
        <View className="mt-4 bg-card rounded-xl border border-border">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-text font-extrabold">Add exercise</Text>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              className="p-2 rounded-lg bg-field border border-fieldBorder"
            >
              <MaterialCommunityIcons name="plus" size={20} />
            </TouchableOpacity>
          </View>

          <LogTable
            items={(selectedSession?.exercises || []).map(e => ({
              exerciseId: e.exerciseId,
              name: `Exercise ${String(e.exerciseId).slice(-4)}`,
              sets: e.sets || [],
            }))}
            onAddSet={(exerciseId) => onAddSet(exerciseId)}
            onRemoveSet={(exerciseId, idx) => onRemoveSet(exerciseId, idx + 1)}
            onUpdateSet={(exerciseId, idx, field, value) => {
              const reps    = field === "reps"    ? Number(value) : undefined;
              const weight  = field === "weight"  ? Number(value) : undefined;
              onUpdateSet(exerciseId, idx + 1, reps ?? undefined, weight ?? undefined);
            }}
            onRemoveExercise={(exerciseId) => onRemoveExercise(exerciseId)}
          />
        </View>

        <View className="h-28" />
      </ScrollView>

      {/* Finish button */}
      <FinishButton
        offsetBottom={BTN_OFFSET}
        disabled={finishDisabled}
        onPress={onFinish}
      />

      {/* Exercise picker → adds planned exercise to session */}
      <ExercisePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        day={currentDay}
        selectedIds={new Set((selectedSession?.exercises || []).map(e => String(e.exerciseId)))}
        onPick={(exerciseId) => {
          if (!exerciseId) return;
          onAddExercise(exerciseId);
          setPickerOpen(false);
        }}  
      />

      <BottomTabs role={20} currentHref="/(screens)/tracking" />
    </View>
  );
}
