// app/TrackWorkout.jsx
import React, { useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform,
} from "react-native";
import { Stack } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

    // TODO: POST to your API here, then clear the log on success.

    console.log("Workout payload:", payload);
    safeAlert(
      "Workout finished!",
      `Exercises: ${entries.length}\nSets logged: ${completedSets}/${totalSets}\nVolume: ${totalVolume} kg·reps`
    );

    setLog({});
  };

  const finishDisabled = Object.values(log).length === 0;

  return (
    <View className="flex-1 bg-[#1E1E1E]">
      <Stack.Screen
        options={{
          title: `Plan #${plan.id}`,
          headerStyle: { backgroundColor: "#1E1E1E" },
          headerTintColor: "#FFD100",
          headerTitleStyle: { fontWeight: "bold", fontSize: 22 },
        }}
      />

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
                    active ? "bg-[#FFD100] border-[#FFD100]" : "bg-transparent border-[#333533]"
                  }`}
                >
                  <Text className={`text-center px-1 ${active ? "text-[#0B0F12] font-extrabold" : "text-[#F4F4F4]"}`}>
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
        <View className="mt-2 bg-[#2B2B2B] rounded-xl overflow-hidden border border-[#000]/40">
          <View className="flex-row">
            <View className="flex-1 border-r border-[#000]/40 px-3 py-2">
              <Text className="text-[#F4F4F4] font-bold underline">Exercises</Text>
            </View>
            <View className="w-20 border-r border-[#000]/40 items-center px-3 py-2">
              <Text className="text-[#F4F4F4] font-bold">Sets</Text>
            </View>
            <View className="w-28 items-center px-3 py-2">
              <Text className="text-[#F4F4F4] font-bold">Last Max (kg)</Text>
            </View>
          </View>

          {currentDay?.exercises?.map((ex) => (
            <View key={ex.id} className="flex-row border-t border-[#000]/40">
              <View className="flex-1 px-3 py-3 border-r border-[#000]/40">
                <Text className="text-[#F4F4F4]">{ex.name}</Text>
              </View>
              <View className="w-20 items-center justify-center border-r border-[#000]/40">
                <Text className="text-[#CFCFCF]">#{ex.sets}</Text>
              </View>
              <View className="w-28 items-center justify-center">
                <Text className="text-[#F4F4F4] font-bold">{getEffectiveLastMax(ex)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ===== add exercise + log table ===== */}
        <View className="mt-4 bg-[#2B2B2B] rounded-xl border border-[#000]/40">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-[#F4F4F4] font-extrabold">Add exercise</Text>
            <TouchableOpacity onPress={() => setPickerOpen(true)} className="p-2 rounded-lg bg-[#333533]">
              <MaterialCommunityIcons name="plus" size={20} color="#FFD100" />
            </TouchableOpacity>
          </View>

          <View className="border-t border-[#000]/40">
            {/* header */}
            <View className="flex-row">
              <View className="flex-1 border-r border-[#000]/40 px-3 py-2">
                <Text className="text-[#F4F4F4] font-bold">Exercises</Text>
              </View>
              <View className="w-20 border-r border-[#000]/40 items-center px-3 py-2">
                <Text className="text-[#F4F4F4] font-bold">Set</Text>
              </View>
              <View className="w-24 border-r border-[#000]/40 items-center px-3 py-2">
                <Text className="text-[#F4F4F4] font-bold">Reps</Text>
              </View>
              <View className="w-24 border-r border-[#000]/40 items-center px-3 py-2">
                <Text className="text-[#F4F4F4] font-bold">Weight</Text>
              </View>
              <View className="w-12 items-center px-1 py-2">
                <Text className="text-[#F4F4F4] font-bold"> </Text>
              </View>
            </View>

            {Object.values(log).length === 0 ? (
              <Text className="text-[#9AA0A6] px-4 py-3">No exercises added yet.</Text>
            ) : (
              Object.values(log).map(({ exercise, sets }) => (
                <View key={exercise.id} className="border-t border-[#000]/40">
                  {sets.map((s, idx) => (
                    <View key={idx} className="flex-row items-stretch">
                      {idx === 0 ? (
                        <View className="flex-1 px-3 py-3 border-r border-[#000]/40">
                          <Text className="text-[#F4F4F4]">{exercise.name}</Text>
                          <TouchableOpacity
                            onPress={() => removeExerciseFromLog(exercise.id)}
                            className="mt-2 self-start px-2 py-1 rounded-lg bg-[#3b3b3b]"
                          >
                            <Text className="text-[#F4F4F4] text-xs">remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="flex-1 border-r border-[#000]/40" />
                      )}

                      <View className="w-20 items-center justify-center border-r border-[#000]/40">
                        <Text className="text-[#F4F4F4]">set {idx + 1}</Text>
                      </View>

                      <View className="w-24 items-stretch justify-center border-r border-[#000]/40 px-2 py-2">
                        <TextInput
                          value={String(s.reps ?? "")}
                          onChangeText={(v) =>
                            updateSet(exercise.id, idx, "reps", v.replace(/[^0-9]/g, ""))
                          }
                          keyboardType="numeric"
                          inputMode="numeric"
                          placeholder="0"
                          placeholderTextColor="#666"
                          className="bg-[#1F2937] text-white rounded-lg px-3 h-10"
                        />
                      </View>

                      <View className="w-24 items-stretch justify-center border-r border-[#000]/40 px-2 py-2">
                        <TextInput
                          value={String(s.weight ?? "")}
                          onChangeText={(v) =>
                            updateSet(exercise.id, idx, "weight", v.replace(/[^0-9.]/g, ""))
                          }
                          keyboardType="numeric"
                          inputMode="decimal"
                          placeholder="0"
                          placeholderTextColor="#666"
                          className="bg-[#1F2937] text-white rounded-lg px-3 h-10"
                        />
                      </View>

                      <View className="w-12 items-center justify-center px-1">
                        <TouchableOpacity
                          onPress={() => removeSet(exercise.id, idx)}
                          className="px-2 py-1 rounded-md bg-[#3b3b3b]"
                          accessibilityLabel={`Remove set ${idx + 1}`}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#F4F4F4" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <View className="flex-row border-t border-[#000]/40">
                    <View className="flex-1 border-r border-[#000]/40" />
                    <TouchableOpacity
                      onPress={() => addSet(exercise.id)}
                      className="w-20 items-center justify-center border-r border-[#000]/40"
                    >
                      <Text className="text-[#F4F4F4]">+ set</Text>
                    </TouchableOpacity>
                    <View className="w-24 border-r border-[#000]/40" />
                    <View className="w-24 border-r border-[#000]/40" />
                    <View className="w-12" />
                  </View>
                </View>
              ))
            )}
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
            finishDisabled ? "bg-[#3b3b3b] opacity-60" : "bg-[#FFD100]"
          }`}
        >
          <Text className={`${finishDisabled ? "text-[#CFCFCF]" : "text-[#0B0F12] font-extrabold"}`}>
            Finish Workout
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== Exercise Picker ===== */}
      <Modal visible={pickerOpen} animationType="fade" transparent onRequestClose={() => setPickerOpen(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#2B2B2B] rounded-t-2xl p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[#FFD100] text-lg font-extrabold">Pick exercise</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} className="px-3 py-1 rounded-lg bg-[#333]">
                <Text className="text-white font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[60vh]">
              {plan.days.map((day) => (
                <View key={day.id} className="mb-3">
                  <Text className="text-[#CFCFCF] mb-1">{day.name}</Text>
                  <View className="bg-[#1F1F1F] rounded-xl overflow-hidden border border-[#000]/40">
                    {day.exercises.map((ex, i) => {
                      const disabled = !!log[ex.id];
                      return (
                        <TouchableOpacity
                          key={ex.id}
                          disabled={disabled}
                          onPress={() => {
                            addExerciseToLog(ex);
                            setPickerOpen(false);
                          }}
                          className={`px-3 py-3 ${i > 0 ? "border-t border-[#000]/40" : ""} ${
                            disabled ? "opacity-50" : "active:opacity-80"
                          }`}
                        >
                          <View className="flex-row items-center justify-between">
                            <Text className="text-[#F4F4F4]">{ex.name}</Text>
                            <Text className="text-[#9AA0A6] text-xs">
                              planned: {ex.sets} • last max {getEffectiveLastMax(ex)}kg
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
