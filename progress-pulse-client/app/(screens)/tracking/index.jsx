// app/TrackWorkout.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AppLogo from "../../../assets/components/ui/AppLogo"; 


/* === sample data — replace with your real plan === */
const samplePlan = {
  id: "P-001",
  days: [
    {
      id: "day1",
      name: "Day 1 - Push",
      exercises: [
        { id: "bench", name: "Barbell Bench Press", sets: 4, lastMaxKg: 90 },
        { id: "ohp", name: "Overhead Press", sets: 3, lastMaxKg: 55 },
        { id: "cableFly", name: "Cable Fly", sets: 3, lastMaxKg: 30 },
      ],
    },
    {
      id: "day2",
      name: "Day 2 - Pull",
      exercises: [
        { id: "deadlift", name: "Deadlift", sets: 3, lastMaxKg: 140 },
        { id: "row", name: "Barbell Row", sets: 4, lastMaxKg: 70 },
      ],
    },
    {
      id: "day3",
      name: "Day 3 - Legs",
      exercises: [
        { id: "squat", name: "Back Squat", sets: 5, lastMaxKg: 110 },
        { id: "legExt", name: "Leg Extension", sets: 3, lastMaxKg: 45 },
      ],
    },
  ],
};

/* === helpers === */
const getLastMaxFromLog = (arr = []) =>
  Math.max(0, ...(arr.map((s) => Number(s.weight) || 0)));

const safeAlert = (title, msg = "") => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n${msg}`);
    else console.log("ALERT:", title, msg);
  } else {
    Alert.alert(title, msg);
  }
};

export default function TrackWorkout() {
  const [plan] = useState(samplePlan);
  const [selectedDayId, setSelectedDayId] = useState(plan.days[0]?.id);

  // log shape: { [exerciseId]: { exercise, sets: [{weight, reps}] } }
  const [log, setLog] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const currentDay = useMemo(
    () => plan.days.find((d) => d.id === selectedDayId) ?? plan.days[0],
    [plan, selectedDayId]
  );

  const getEffectiveLastMax = (ex) => {
    const fromPlan = ex.lastMaxKg ?? 0;
    const fromLog = getLastMaxFromLog(log[ex.id]?.sets);
    return Math.max(fromPlan, fromLog);
  };

  /* ===== log actions ===== */
  const addExerciseToLog = (ex) =>
    setLog((prev) =>
      prev[ex.id] ? prev : { ...prev, [ex.id]: { exercise: ex, sets: [{ weight: "", reps: "" }] } }
    );

  const removeExerciseFromLog = (exId) =>
    setLog((prev) => {
      const next = { ...prev };
      delete next[exId];
      return next;
    });

  const updateSet = (exId, idx, field, value) =>
    setLog((prev) => {
      const entry = prev[exId];
      if (!entry) return prev;
      const sets = [...entry.sets];
      sets[idx] = { ...sets[idx], [field]: value };
      return { ...prev, [exId]: { ...entry, sets } };
    });

  const addSet = (exId) =>
    setLog((prev) => {
      const entry = prev[exId];
      if (!entry) return prev;
      return { ...prev, [exId]: { ...entry, sets: [...entry.sets, { weight: "", reps: "" }] } };
    });

  const removeSet = (exId, idx) =>
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

  /* ===== finish workout ===== */
  const handleFinishWorkout = async () => {
    const entries = Object.values(log);
    if (entries.length === 0) {
      safeAlert("Nothing to save", "Add at least one exercise before finishing.");
      return;
    }

    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;

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
        cleaned.forEach((s) => {
          if (s.weight != null && s.reps != null) {
            completedSets += 1;
            totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
          }
        });
        return { exerciseId: exercise.id, name: exercise.name, sets: cleaned };
      }),
      summary: { totalSets, completedSets, totalVolume },
    };

    console.log("Workout payload:", payload);
    safeAlert(
      "Workout finished!",
      `Exercises: ${entries.length}\nSets logged: ${completedSets}/${totalSets}\nVolume: ${totalVolume} kg·reps`
    );

    setLog({});
  };

  const finishDisabled = Object.values(log).length === 0;



  // --- column sizing (keeps names from being squeezed) ---
  const COL = {
    EX_MIN: 240, // Exercise column minimum (allows full names to wrap)
    SET_W: 72,   // "Set" / "Sets"
    NUM_W: 96,   // "Reps" / "Weight"
    BTN_W: 48,   // trash button
  };

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo/>, 
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />

      {/* in-page title */}
      <View className="px-4 pt-5">
        <Text className="text-text text-2xl font-extrabold">Track Workout</Text>
        <Text className="text-muted mt-1">
          Log sets and weights for today’s session.
        </Text>
      </View>

      {/* ===== compact day picker ===== */}
      <View className="px-4 pt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pb-2">
            {plan.days.map((d) => {
              const active = d.id === currentDay?.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => setSelectedDayId(d.id)}
                  className={`h-24 w-24 rounded-2xl border items-center justify-center ${
                    active ? "bg-primary border-primary" : "bg-transparent border-border"
                  }`}
                >
                  <Text
                    className={`text-center px-1 ${
                      active ? "text-onPrimary font-extrabold" : "text-text"
                    }`}
                  >
                    {d.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* ===== summary table ===== */}
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

          {(currentDay?.exercises ?? []).map((ex) => (
            <View key={ex.id} className="flex-row border-t border-border">
              <View className="flex-1 px-3 py-3 border-r border-border">
                <Text className="text-text">{ex.name}</Text>
              </View>
              <View className="w-20 items-center justify-center border-r border-border">
                <Text className="text-muted">#{ex.sets}</Text>
              </View>
              <View className="w-28 items-center justify-center">
                <Text className="text-text font-bold">{getEffectiveLastMax(ex)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ===== add exercise + log table ===== */}
        <View className="mt-4 bg-card rounded-xl border border-border">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-text font-extrabold">Add exercise</Text>
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              className="p-2 rounded-lg bg-field border border-fieldBorder"
            >
              <MaterialCommunityIcons name="plus" size={20} color="#007BFF" />
            </TouchableOpacity>
          </View>

          {/* swipe hint */}
          <View className="px-4 pb-1 -mt-2">
            <View className="self-start flex-row items-center gap-1.5 px-2 py-1 rounded-full bg-field border border-fieldBorder">
              <MaterialCommunityIcons name="gesture-swipe-horizontal" size={14} color="#667085" />
              <Text className="text-[12px] text-muted">Swipe left/right to see all columns</Text>
            </View>
          </View>

          <View className="border-t border-border">
            {/* full log table is horizontally scrollable */}
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View
                style={{
                  minWidth: COL.EX_MIN + COL.SET_W + COL.NUM_W + COL.NUM_W + COL.BTN_W,
                }}
              >
                {/* header */}
                <View className="flex-row bg-field border-b border-fieldBorder">
                  <View
                    className="px-3 py-2 border-r border-fieldBorder"
                    style={{ minWidth: COL.EX_MIN, flexGrow: 1 }}
                  >
                    <Text className="text-text font-bold">Exercise</Text>
                  </View>
                  <View
                    className="items-center px-3 py-2 border-r border-fieldBorder"
                    style={{ width: COL.SET_W }}
                  >
                    <Text className="text-text font-bold">Set</Text>
                  </View>
                  <View
                    className="items-center px-3 py-2 border-r border-fieldBorder"
                    style={{ width: COL.NUM_W }}
                  >
                    <Text className="text-text font-bold">Reps</Text>
                  </View>
                  <View
                    className="items-center px-3 py-2 border-r border-fieldBorder"
                    style={{ width: COL.NUM_W }}
                  >
                    <Text className="text-text font-bold">Weight</Text>
                  </View>
                  <View className="items-center px-1 py-2" style={{ width: COL.BTN_W }} />
                </View>

                {/* rows */}
                {Object.values(log).length === 0 ? (
                  <Text className="text-muted px-4 py-3">No exercises added yet.</Text>
                ) : (
                  Object.values(log).map(({ exercise, sets }) => (
                    <View key={exercise.id} className="border-t border-border">
                      {sets.map((s, idx) => (
                        <View key={idx} className="flex-row items-stretch">
                          {/* Exercise name (wraps to show full name) */}
                          {idx === 0 ? (
                            <View
                              className="px-3 py-3 border-r border-border"
                              style={{ minWidth: COL.EX_MIN, flexGrow: 1 }}
                            >
                              <Text
                                className="text-text"
                                style={{ flexShrink: 1, flexWrap: "wrap", lineHeight: 18 }}
                              >
                                {exercise.name}
                              </Text>
                              <TouchableOpacity
                                onPress={() => removeExerciseFromLog(exercise.id)}
                                className="mt-2 self-start px-2 py-1 rounded-lg bg-field border border-fieldBorder"
                              >
                                <Text className="text-text text-xs">remove</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View
                              className="border-r border-border"
                              style={{ minWidth: COL.EX_MIN, flexGrow: 1 }}
                            />
                          )}

                          <View
                            className="items-center justify-center border-r border-border"
                            style={{ width: COL.SET_W }}
                          >
                            <Text className="text-text">set {idx + 1}</Text>
                          </View>

                          <View
                            className="justify-center border-r border-border px-2 py-2"
                            style={{ width: COL.NUM_W }}
                          >
                            <TextInput
                              value={String(s.reps ?? "")}
                              onChangeText={(v) =>
                                updateSet(exercise.id, idx, "reps", v.replace(/[^0-9]/g, ""))
                              }
                              keyboardType="numeric"
                              inputMode="numeric"
                              placeholder="0"
                              placeholderTextColor="#667085"
                              className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-10"
                            />
                          </View>

                          <View
                            className="justify-center border-r border-border px-2 py-2"
                            style={{ width: COL.NUM_W }}
                          >
                            <TextInput
                              value={String(s.weight ?? "")}
                              onChangeText={(v) =>
                                updateSet(exercise.id, idx, "weight", v.replace(/[^0-9.]/g, ""))
                              }
                              keyboardType="numeric"
                              inputMode="decimal"
                              placeholder="0"
                              placeholderTextColor="#667085"
                              className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-10"
                            />
                          </View>

                          <View
                            className="items-center justify-center px-1"
                            style={{ width: COL.BTN_W }}
                          >
                            <TouchableOpacity
                              onPress={() => removeSet(exercise.id, idx)}
                              className="px-2 py-1 rounded-md bg-field border border-fieldBorder"
                              accessibilityLabel={`Remove set ${idx + 1}`}
                            >
                              <MaterialCommunityIcons
                                name="trash-can-outline"
                                size={16}
                                color="#2C2C2C"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      <View className="flex-row border-t border-border">
                        <View
                          className="border-r border-border"
                          style={{ minWidth: COL.EX_MIN, flexGrow: 1 }}
                        />
                        <TouchableOpacity
                          onPress={() => addSet(exercise.id)}
                          className="items-center justify-center border-r border-border"
                          style={{ width: COL.SET_W }}
                        >
                          <Text className="text-primary font-bold">+ set</Text>
                        </TouchableOpacity>
                        <View className="border-r border-border" style={{ width: COL.NUM_W }} />
                        <View className="border-r border-border" style={{ width: COL.NUM_W }} />
                        <View style={{ width: COL.BTN_W }} />
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

      {/* ===== Finish Workout button (sticky) ===== */}
      <View className="absolute left-0 right-0 bottom-4 px-4">
        <TouchableOpacity
          disabled={finishDisabled}
          onPress={handleFinishWorkout}
          className={`h-12 rounded-xl items-center justify-center ${
            finishDisabled ? "bg-card opacity-60" : "bg-primary"
          }`}
        >
          <Text className={`${finishDisabled ? "text-muted" : "text-onPrimary font-extrabold"}`}>
            Finish Workout
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== Exercise Picker (centered dialog) ===== */}
      <Modal
        visible={pickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-4">
          <View className="w-full max-w-[560px] rounded-2xl bg-card border border-border p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-primary text-lg font-extrabold">
                Pick exercise — {currentDay?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setPickerOpen(false)}
                className="px-3 py-1 rounded-lg bg-field border border-fieldBorder"
              >
                <Text className="text-text font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[70vh]">
              <View className="bg-bg rounded-xl overflow-hidden border border-border">
                {(currentDay?.exercises ?? []).map((ex, i) => {
                  const disabled = !!log[ex.id];
                  return (
                    <TouchableOpacity
                      key={ex.id}
                      disabled={disabled}
                      onPress={() => {
                        addExerciseToLog(ex);
                        setPickerOpen(false);
                      }}
                      className={`px-3 py-3 ${i > 0 ? "border-t border-border" : ""} ${
                        disabled ? "opacity-50" : "active:opacity-80"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-text">{ex.name}</Text>
                        <Text className="text-muted text-xs">
                          planned: {ex.sets} • max {getEffectiveLastMax(ex)}kg
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
