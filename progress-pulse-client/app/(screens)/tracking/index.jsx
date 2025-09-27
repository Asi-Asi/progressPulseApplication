// app/(screens)/tracking/index.jsx
import React, { useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, ScrollView, Alert, Platform, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppLogo from "../../../assets/components/ui/AppLogo";
import BookIcon from "../../../assets/images/svg/book.svg";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";

// Components
import DayPicker from "../../../assets/components/screens/tracking/DayPicker";
import SummaryTable from "../../../assets/components/screens/tracking/SummaryTable";
import AddExerciseTable from "../../../assets/components/screens/tracking/AddExerciseTable";
import ExercisePickerModal from "../../../assets/components/screens/tracking/ExercisePickerModal";
import FinishWorkoutButton from "../../../assets/components/screens/tracking/FinishWorkoutButton";

// (visual fallback only)
const samplePlan = {
  id: "P-001",
  days: [
    { id: "1", name: "Day 1 - Push", exercises: [] },
    { id: "2", name: "Day 2 - Pull", exercises: [] },
    { id: "3", name: "Day 3 - Legs", exercises: [] },
  ],
};

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

  // keep the button above tabs
  const TAB_CARD_HEIGHT = 64;
  const TAB_OUTER_MARGIN = 16;
  const EXTRA_GAP = 8;
  const BTN_OFFSET = TAB_CARD_HEIGHT + TAB_OUTER_MARGIN + Math.max(insets.bottom, 12) + EXTRA_GAP;

  // auth + server state
  const [token, setToken] = useState("");
  useEffect(() => {
    AsyncStorage.getItem("token").then((t) => setToken(t || ""));
  }, []);

  // “picked day” and session that DayPicker loads for that day
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [session, setSession] = useState(null);            // full session doc from /view
  const [maxByExercise, setMaxByExercise] = useState({});  // from /view
  const [nameById, setNameById] = useState({});            // map built from /plans/me

  // local log UI (unchanged)
  const [log, setLog] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);

  // fallback day card label only (while plan loads)
  const currentDay = useMemo(
    () => samplePlan.days.find((d) => String(d.id) === String(selectedDayId)) ?? samplePlan.days[0],
    [selectedDayId]
  );

  // local log helpers (unchanged)
  const updateSet = (exId, idx, field, value) => {
    setLog((prev) => {
      const entry = prev[exId];
      if (!entry) return prev;
      const sets = [...entry.sets];
      sets[idx] = { ...sets[idx], [field]: value };
      return { ...prev, [exId]: { ...entry, sets } };
    });
  };
  const addSet = (exId) => {
    setLog((prev) => {
      const entry = prev[exId];
      if (!entry) return prev;
      return { ...prev, [exId]: { ...entry, sets: [...entry.sets, { weight: "", reps: "" }] } };
    });
  };
  const removeSet = (exId, idx) => {
    setLog((prev) => {
      const entry = prev[exId];
      if (!entry) return prev;
      const nextSets = entry.sets.filter((_, i) => i !== idx);
      if (nextSets.length === 0) {
        const copy = { ...prev };
        delete copy[exId];
        return copy;
      }
      return { ...prev, [exId]: { ...entry, sets: nextSets } };
    });
  };
  const removeExerciseFromLog = (exId) => {
    setLog((prev) => {
      const next = { ...prev };
      delete next[exId];
      return next;
    });
  };

  const finishDisabled = Object.values(log).length === 0;
  const COL = { EX_MIN: 240, SET_W: 72, NUM_W: 96, BTN_W: 48 };

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

      {/* Day picker – this is where the 3 routes happen */}
      <DayPicker
        token={token}
        selectedDayId={selectedDayId}
        onSelectDay={(id) => {
          setSelectedDayId(id);
          setLog({}); // optional: clear local log when switching days
        }}
        onSessionLoaded={({ session, maxByExercise, nameById: map }) => {
          setSession(session);
          setMaxByExercise(maxByExercise || {});
          if (map) setNameById(map);
        }}
        initialPlan={samplePlan}
      />

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: BTN_OFFSET + 80 }}>
        {/* Summary table – shows planned + max for the picked session */}
        <SummaryTable
          key={session?._id /* force refresh when day/session changes */}
          token={token}
          sessionId={session?._id}
          fallbackExercises={currentDay?.exercises ?? []}
          nameById={nameById}
        />

        {/* Local log UI (your existing editor table) */}
        <AddExerciseTable
          log={log}
          updateSet={updateSet}
          removeSet={removeSet}
          addSet={addSet}
          removeExerciseFromLog={removeExerciseFromLog}
          onOpenPicker={() => setPickerOpen(true)}
          COL={COL}
        />

        <View className="h-28" />
      </ScrollView>

      {/* Finish button – keep local for now */}
      <FinishWorkoutButton
        disabled={finishDisabled}
        onPress={() => safeAlert("Finish Workout", "Wire to close-session when you’re ready")}
        bottomOffset={BTN_OFFSET}
      />

      {/* Exercise Picker – still for the local log */}
      <ExercisePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentDay={currentDay}
        log={log}
        addExerciseToLog={(ex) =>
          setLog((prev) =>
            prev[ex.id] ? prev : { ...prev, [ex.id]: { exercise: ex, sets: [{ weight: "", reps: "" }] } }
          )
        }
        getEffectiveLastMax={() => 0}
      />

      <BottomTabs role={20} currentHref="/(screens)/tracking" />
    </View>
  );
}
