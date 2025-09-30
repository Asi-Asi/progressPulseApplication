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
  closeSession as apiCloseSession, discardSession as apiDiscardSession,
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
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);   // ספינר לפעולות עדכון (הוספה/סטים)

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

      console.log("[TRACK] refreshView() -> sessionId:", sessionId);
      const { session: sess, maxByExercise: pr } = await getSessionView({ token, sessionId });
      setSession(sess);
      setMaxByExercise(pr || {});

      console.log("[TRACK] refreshView() -> done:", {
        sessId: sess?._id, status: sess?.status, planDay: sess?.planDay,
        exCount: sess?.exercises?.length ?? 0
      });
    } catch (e) {
    }
  }

  async function refreshWithSpinner(sessionId) {
    setRefreshing(true);
    try { await refreshView(sessionId); }
    finally { setRefreshing(false); }
  }

  async function onStartSessionForDay(dayNumber) {
    if (!token) return safeAlert("Missing token");
    const planId = planMeta?._id || planMeta?.planId || planMeta?.id;
    if (!planId) return safeAlert("Missing plan", "Finish your plan first.");
    try {
      console.log("[TRACK] onStartSessionForDay() -> dayNumber:", dayNumber, "| planId:", planMeta?._id || planMeta?.planId || planMeta?.id);
      setStarting(true);
     // לא מסתירים לפני שהכול הצליח; נשאיר גלוי עד שנפתח סשן בהצלחה
     // אם יש סשן פתוח ליום אחר – לזרוק אותו לפני שפותחים חדש
      if (
        session &&
        session.status === "open" &&
        String(session.planDay) !== String(dayNumber)
      ) {
        console.log("[TRACK] Discarding previous open session:", session._id, " (day", session.planDay, ")");
        await apiDiscardSession({ token, sessionId: session._id });
        setSession(null); // נקה state מקומי
        setPickerOpen(false);
      }
      const s = await createSession({ token, fromPlanId: planId, planDay: dayNumber });
      setSession(s);
      await refreshView(s._id);
      console.log("[TRACK] started session:", { _id: s?._id, status: s?.status, planDay: s?.planDay });

      setSelectedDayId(String(dayNumber));
      // עכשיו אפשר להסתיר את ה-picker
      setShowPicker(false);

    } catch (e) {
      setShowPicker(true);
      safeAlert("Start failed", e?.message || "Failed to start session");

    } finally {
      setStarting(false);   
    }
    
  }

  async function onAddExercise(exerciseId) {
  const target = selectedSession || session; // ננסה קודם את המתאים ליום
  console.log("[TRACK] onAddExercise ->", {
    exerciseId,
    selectedDayId,
    targetSessionId: target?._id || null,
    targetPlanDay: target?.planDay,
    targetStatus: target?.status
  });

  if (!target?._id) {
    return safeAlert("Start a session", "Pick a day and tap Start/Resume first.");
  }
  try {
    setMutating(true);
    // שליחה לשרת
    await apiAddExercise({ token, sessionId: target._id, exerciseId });
    // רענון מהשרת עם ספינר קצר
    await refreshView(target._id);
    console.log("[TRACK] onAddExercise -> OK (refreshed)");    
  } catch (e) {
    console.log("[TRACK] onAddExercise -> FAILED:", e?.message, e);
    safeAlert("Add exercise failed", e?.message || "");
  }finally{
    setMutating(false);
  }
}

  async function onRemoveExercise(exerciseId) {
    try {
      const updated = await apiRemoveExercise({ token, sessionId: session._id, exerciseId });
      setSession(updated);
    } catch (e) { safeAlert("Remove exercise failed", e?.message || ""); }
  }

  async function onAddSet(exerciseId) {
    try {
      setMutating(true);
      const updated = await apiAddSet({ token, sessionId: session._id, exerciseId, reps: 0, weight: 0 });
      await refreshView(session._id);
    } catch (e) { safeAlert("Add set failed", e?.message || "");

    }finally{
      setMutating(false);
    }
  }

  async function onUpdateSet(exerciseId, idx0, repsMaybe, weightMaybe) {
    try {
      const ex = (session?.exercises || []).find(e => String(e.exerciseId) === String(exerciseId));
      const idx = Math.max(0, Number(idx0 ?? 0));      
      const cur = ex?.sets?.[idx] || {};

      const reps   = repsMaybe   !== undefined && repsMaybe   !== "" ? Number(repsMaybe)   : Number(cur.reps ?? 0);
      const weight = weightMaybe !== undefined && weightMaybe !== "" ? Number(weightMaybe) : Number(cur.weight ?? 0);

      if (!Number.isFinite(reps)   || reps   < 0) throw new Error("Bad reps");
      if (!Number.isFinite(weight) || weight < 0) throw new Error("Bad weight");

      const setNumber = idx + 1;  

      await apiUpdateSet({
        token,
        sessionId: session._id,
        exerciseId,
        setNumber,
        reps,
        weight,
      });
      await refreshView(session._id);
    } catch (e) {
      safeAlert("Update set failed", e?.message || "");
    }
  }

  async function onRemoveSet(exerciseId, idx0) {
    try {
      const setNumber = (Number(idx0 ?? 0) + 1);  
      const updated = await apiRemoveSet({
        token,
        sessionId: session._id,
        exerciseId,
        setNumber,
      });
      setSession(updated);
    } catch (e) {
      safeAlert("Remove set failed", e?.message || "");
    }
  }



  async function onFinish() {
    const target = selectedSession || session;
    if (!target?._id) {
      return safeAlert("Start a session", "Pick a day and tap Start/Resume first.");
    }
    try {
      setMutating(true);
      await apiCloseSession({ token, sessionId: target._id });
      await refreshView(target._id); // סנכרון מצב הסשן ל-"closed"
      setShowPicker(true);           // מחזיר את ה-picker אחרי סגירה
      safeAlert("Workout finished", "Saved to history.");
    } catch (e) {
      // אם כבר נסגר/לא נמצא – נרענן ונעדכן את המשתמש בעדינות
      if (e?.status === 404 || e?.status === 409) {
        await refreshView(target._id);
        setShowPicker(true);
        safeAlert("Session already finished", "I refreshed your view.");
      } else {
        safeAlert("Finish failed", e?.message || "");
      }
    } finally {
      setMutating(false);
    }
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

  const canResume = !!(
    session &&
    session.status === "open" &&
    String(session.planDay) === String(selectedDayId)
  );
  useEffect(() => {
  console.log("[TRACK] STATE SNAPSHOT =>",
    {
      selectedDayId,
      session: session ? {
        _id: session._id,
        status: session.status,
        planDay: session.planDay,
        exCount: session.exercises?.length ?? 0,
      } : null,
      selectedSession: selectedSession ? {
        _id: selectedSession._id,
        status: selectedSession.status,
        planDay: selectedSession.planDay,
        exCount: selectedSession.exercises?.length ?? 0,
      } : null,
    }
  );
}, [session, selectedDayId, selectedSession]);

  const finishDisabled = !selectedSession || (selectedSession.exercises || []).length === 0;


// השוואה בין יום שנבחר לסשן פתוח
useEffect(() => {
  const match = session && String(session.planDay) === String(selectedDayId);
  console.log("[TRACK] session check => planDay:", session?.planDay, "| selectedDayId:", selectedDayId, "| match:", match);
}, [session, selectedDayId]);



// מיפוי exerciseId -> name
const exNameById = useMemo(() => {
    const m = {};
    (planMeta?.days ?? []).forEach(day => {
      const arr = day.items ?? day.exercises ?? [];
      arr.forEach(it => {
        if (it?.exerciseId) m[String(it.exerciseId)] = it.name ?? "";
      });
    });
    return m;
  }, [planMeta]);



  useEffect(() => {
  if (session?.status === "open") {
    setSelectedDayId(String(session.planDay));
    setShowPicker(true);
  }
}, [session?.status]);

const addDisabled = !selectedSession || starting || mutating;

  //################################################################################################//
  //################################################################################################//
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
      {(showPicker) && (
        <>
          <DayPicker
            days={uiDays}
            selectedDayId={String(selectedDayId || "")}
            onSelect={setSelectedDayId}
          />

          <View className="px-4 pt-4">
            {canResume ? (
              // RESUME רק אם היום הנבחר הוא של הסשן הפתוח
              <TouchableOpacity
                disabled={starting}
                onPress={async () => {
                  try {
                    setStarting(true);
                    await refreshView(session._id);  // טען מצב עדכני
                    setSelectedDayId(String(session.planDay));
                    setShowPicker(false);
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
              // אחרת – START ליום שנבחר
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
              onPress={() => !addDisabled && setPickerOpen(true)}
              disabled={addDisabled}
              className={`p-2 rounded-lg border border-fieldBorder ${addDisabled ? "bg-card opacity-60" : "bg-field"}`}
            >
            {mutating ? (
              <ActivityIndicator size="small" />
            ) : (
              <MaterialCommunityIcons name="plus" size={20} />
            )}
            </TouchableOpacity>
          </View>

          <LogTable
            items={(selectedSession?.exercises || []).map(e => ({
              exerciseId: e.exerciseId,
              name: exNameById[String(e.exerciseId)] || `Exercise ${String(e.exerciseId).slice(-4)}`,
              sets: e.sets || [],
            }))}
            disabled={!selectedSession || refreshing}
            onAddSet={(exerciseId) => onAddSet(exerciseId)}
            onRemoveSet={(exerciseId, idx1) => onRemoveSet(exerciseId, idx1)}
            onUpdateSet={(exerciseId, idx1, field, value) => {
              const reps    = field === "reps"    ? Number(value) : undefined;
              const weight  = field === "weight"  ? Number(value) : undefined;
              onUpdateSet(exerciseId, idx1, reps ?? undefined, weight ?? undefined);
            }}
            onRemoveExercise={(exerciseId) => onRemoveExercise(exerciseId)}
          />
        </View>

        <View className="h-28" />
      </ScrollView>

      {/* Finish button */}
      <FinishButton
        offsetBottom={BTN_OFFSET}
        disabled={finishDisabled || mutating}
        onPress={onFinish}
      />

      {/* Exercise picker → adds planned exercise to session */}
      <ExercisePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        day={currentDay}
        selectedIds={new Set((selectedSession?.exercises || []).map(e => String(e.exerciseId)))}
        onPick={async (exerciseId) => {

          console.log("[TRACK] pick exercise from plan:", { exerciseId, forDay: selectedDayId, sessionId: selectedSession?._id || session?._id || null });

          if (!exerciseId) return;
          if (!selectedSession) {
            safeAlert("Start a session", "Pick a day and tap Start/Resume first.");
            return;
          }
          await onAddExercise(exerciseId);
          setPickerOpen(false);
        }}  
      />

      <BottomTabs role={20} currentHref="/(screens)/tracking" />
    </View>
  );
}
