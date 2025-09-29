// app/(screens)/tracking/index.jsx
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppLogo from "../../../assets/components/ui/AppLogo";
import BookIcon from "../../../assets/images/svg/book.svg";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";

import DayPicker from "../../../assets/components/screens/tracking/DayPicker";

import SummaryTable from "../../../assets/components/screens/tracking/SummaryTable";

import LogTable from "../../../assets/components/screens/tracking/LogTable";

import ExercisePickerModal from "../../../assets/components/screens/tracking/ExercisePickerModal";

import FinishButton from "../../../assets/components/screens/tracking/FinishButton";

import { getLastMaxFromLog, safeAlert } from "../../../assets/utils/tracking";

/* === sample data — replace with your real plan === */
const samplePlan = {
  id: "P-001",
  days: [
    { id: "day1", name: "Day 1 - Push", exercises: [
      { id: "bench", name: "Barbell Bench Press", sets: 4, lastMaxKg: 90 },
      { id: "ohp", name: "Overhead Press", sets: 3, lastMaxKg: 55 },
      { id: "cableFly", name: "Cable Fly", sets: 3, lastMaxKg: 30 },
    ]},
    { id: "day2", name: "Day 2 - Pull", exercises: [
      { id: "deadlift", name: "Deadlift", sets: 3, lastMaxKg: 140 },
      { id: "row", name: "Barbell Row", sets: 4, lastMaxKg: 70 },
    ]},
    { id: "day3", name: "Day 3 - Legs", exercises: [
      { id: "squat", name: "Back Squat", sets: 5, lastMaxKg: 110 },
      { id: "legExt", name: "Leg Extension", sets: 3, lastMaxKg: 45 },
    ]},
  ],
};

export default function TrackWorkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // keep the button above BottomTabs
  const TAB_CARD_HEIGHT = 64;
  const TAB_OUTER_MARGIN = 16;
  const EXTRA_GAP = 8;
  const BTN_OFFSET = TAB_CARD_HEIGHT + TAB_OUTER_MARGIN + Math.max(insets.bottom, 12) + EXTRA_GAP;

  const [plan] = useState(samplePlan);
  const [selectedDayId, setSelectedDayId] = useState(plan.days[0]?.id);

  // log shape: { [exerciseId]: { exercise, sets: [{weight, reps}] } }
  const [log, setLog] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const currentDay = useMemo(
    () => plan.days.find((d) => d.id === selectedDayId) ?? plan.days[0],
    [plan, selectedDayId]
  );

  /* ===== log actions ===== */
  const addExerciseToLog = (ex) =>
    setLog((prev) => (prev[ex.id] ? prev : { ...prev, [ex.id]: { exercise: ex, sets: [{ weight: "", reps: "" }] } }));

  const removeExerciseFromLog = (exId) =>
    setLog((prev) => { const next = { ...prev }; delete next[exId]; return next; });

  const updateSet = (exId, idx, field, value) =>
    setLog((prev) => {
      const entry = prev[exId]; if (!entry) return prev;
      const sets = [...entry.sets]; sets[idx] = { ...sets[idx], [field]: value };
      return { ...prev, [exId]: { ...entry, sets } };
    });

  const addSet = (exId) =>
    setLog((prev) => { const entry = prev[exId]; if (!entry) return prev;
      return { ...prev, [exId]: { ...entry, sets: [...entry.sets, { weight: "", reps: "" }] } };
    });

  const removeSet = (exId, idx) =>
    setLog((prev) => {
      const entry = prev[exId]; if (!entry) return prev;
      const nextSets = entry.sets.filter((_, i) => i !== idx);
      if (nextSets.length === 0) { const copy = { ...prev }; delete copy[exId]; return copy; }
      return { ...prev, [exId]: { ...entry, sets: nextSets } };
    });

  /* ===== finish workout ===== */
  const handleFinishWorkout = async () => {
    const entries = Object.values(log);
    if (entries.length === 0) { safeAlert("Nothing to save", "Add at least one exercise before finishing."); return; }

    let totalSets = 0, completedSets = 0, totalVolume = 0;
    const payload = {
      planId: plan.id,
      dayId: selectedDayId,
      date: new Date().toISOString(),
      entries: entries.map(({ exercise, sets }) => {
        const cleaned = sets.map((s) => ({
          weight: s.weight === "" ? null : Number(s.weight),
          reps: s.reps === "" ? null : Number(s.reps),
        }));
        totalSets += cleaned.length;
        cleaned.forEach((s) => { if (s.weight != null && s.reps != null) { completedSets += 1; totalVolume += (Number(s.weight)||0) * (Number(s.reps)||0); }});
        return { exerciseId: exercise.id, name: exercise.name, sets: cleaned };
      }),
      summary: { totalSets, completedSets, totalVolume },
    };

    console.log("Workout payload:", payload);
    safeAlert("Workout finished!", `Exercises: ${entries.length}\nSets logged: ${completedSets}/${totalSets}\nVolume: ${totalVolume} kg·reps`);
    setLog({});
  };

  const finishDisabled = Object.values(log).length === 0;

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

      <DayPicker
        days={plan.days}
        selectedDayId={selectedDayId}
        onSelect={setSelectedDayId}
      />

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 64 + 16 + Math.max(insets.bottom, 12) + 8 + 80 }}>
        <SummaryTable day={currentDay} log={log} />

        {/* כפתור הפלוס שפותח את המודאל נשאר כאן כדי לשלוט ב-UI */}
        <View className="mt-4 bg-card rounded-xl border border-border">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-text font-extrabold">Add exercise</Text>
            <TouchableOpacity onPress={() => setPickerOpen(true)} className="p-2 rounded-lg bg-field border border-fieldBorder">
              <MaterialCommunityIcons name="plus" size={20} color="#007BFF" />
            </TouchableOpacity>
          </View>

          {/* טבלת הלוג */}
          <LogTable
            log={log}
            addSet={addSet}
            removeSet={removeSet}
            updateSet={updateSet}
            removeExerciseFromLog={removeExerciseFromLog}
          />
        </View>

        <View className="h-28" />
      </ScrollView>

      <FinishButton offsetBottom={64 + 16 + Math.max(insets.bottom, 12) + 8} disabled={finishDisabled} onPress={handleFinishWorkout} />

      <ExercisePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        day={currentDay}
        log={log}
        onPick={addExerciseToLog}
      />

      <BottomTabs role={20} currentHref="/(screens)/tracking" />
    </View>
  );
}
