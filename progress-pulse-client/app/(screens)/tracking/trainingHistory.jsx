// app/(screens)/tracking/training history.jsx
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Stack } from "expo-router";

/* ===== Demo data (replace with real API later) ===== */
const DEMO_WORKOUTS = [
  {
    id: "w1",
    date: "2025-08-30",
    planId: "P-001",
    dayId: "day1",
    dayName: "Day 1 – Push",
    summary: { totalSets: 10, completedSets: 10 },
    entries: [ 
      {
        exerciseId: "bench",
        name: "Barbell Bench Press",
        sets: [
          { weight: 80, reps: 5 },
          { weight: 80, reps: 5 },
          { weight: 80, reps: 5 },
          { weight: 85, reps: 3 },
        ],
      },
      {
        exerciseId: "ohp",
        name: "Overhead Press",
        sets: [
          { weight: 45, reps: 8 },
          { weight: 45, reps: 8 },
          { weight: 45, reps: 6 },
        ],
      },
      {
        exerciseId: "cableFly",
        name: "Cable Fly",
        sets: [
          { weight: 25, reps: 12 },
          { weight: 25, reps: 12 },
          { weight: 25, reps: 10 },
        ],
      },
    ],
  },
  {
    id: "w2",
    date: "2025-08-27",
    planId: "P-001",
    dayId: "day2",
    dayName: "Day 2 – Pull",
    summary: { totalSets: 7, completedSets: 7 },
    entries: [
      {
        exerciseId: "deadlift",
        name: "Deadlift",
        sets: [
          { weight: 140, reps: 5 },
          { weight: 140, reps: 4 },
          { weight: 130, reps: 5 },
        ],
      },
      {
        exerciseId: "row",
        name: "Barbell Row",
        sets: [
          { weight: 70, reps: 8 },
          { weight: 70, reps: 8 },
          { weight: 70, reps: 8 },
          { weight: 70, reps: 6 },
        ],
      },
    ],
  },
  {
    id: "w3",
    date: "2025-08-24",
    planId: "P-001",
    dayId: "day3",
    dayName: "Day 3 – Legs",
    summary: { totalSets: 8, completedSets: 8 },
    entries: [
      {
        exerciseId: "squat",
        name: "Back Squat",
        sets: [
          { weight: 105, reps: 5 },
          { weight: 105, reps: 5 },
          { weight: 110, reps: 3 },
          { weight: 110, reps: 3 },
        ],
      },
      {
        exerciseId: "legExt",
        name: "Leg Extension",
        sets: [
          { weight: 40, reps: 12 },
          { weight: 40, reps: 12 },
          { weight: 45, reps: 10 },
          { weight: 45, reps: 8 },
        ],
      },
    ],
  },
];

/* ===== Small helper ===== */
const formatDate = (iso) => {
const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function TrainingHistory() {
  const [workouts] = useState(DEMO_WORKOUTS);
  const [active, setActive] = useState(null); // selected workout for details

  const sorted = useMemo(
    () =>
      [...workouts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [workouts]
  );

  return (
    <View className="flex-1 bg-[#1E1E1E]">
      <Stack.Screen
        options={{
          title: "Training History",
          headerStyle: { backgroundColor: "#1E1E1E" },
          headerTintColor: "#FFD100",
          headerTitleStyle: { fontWeight: "bold", fontSize: 22 },
        }}
      />

      <ScrollView className="flex-1 px-4 pt-4">
        {sorted.length === 0 ? (
          <Text className="text-[#9AA0A6] text-center mt-10">
            No workouts yet.
          </Text>
        ) : (
          <View className="pb-10 space-y-3">
            {sorted.map((w) => {
              const { totalSets, completedSets } = w.summary || {};
              const firstTwo = w.entries.slice(0, 2);
              return (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => setActive(w)}
                  activeOpacity={0.9}
                  className="bg-[#2B2B2B] rounded-xl border border-[#000]/40 p-4"
                >
                  {/* Header: Date + Day name */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[#F4F4F4] font-bold text-base">
                      {formatDate(w.date)}
                    </Text>
                    {!!w.dayName && (
                      <View className="px-3 py-1 rounded-full bg-[#FFD100]">
                        <Text className="text-[#0B0F12] font-extrabold text-xs">
                          {w.dayName}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Summary line (no volume) */}
                  <View className="flex-row gap-4 mt-2">
                    <Text className="text-[#CFCFCF]">
                      Exercises:{" "}
                      <Text className="text-[#F4F4F4] font-bold">
                        {w.entries.length}
                      </Text>
                    </Text>
                    <Text className="text-[#CFCFCF]">
                      Sets:{" "}
                      <Text className="text-[#F4F4F4] font-bold">
                        {completedSets ?? 0}/{totalSets ?? 0}
                      </Text>
                    </Text>
                  </View>

                  {/* Preview of first exercises */}
                  <View className="mt-3 space-y-1">
                    {firstTwo.map((e) => (
                      <Text key={e.exerciseId} className="text-[#F4F4F4]">
                        • {e.name}{" "}
                        <Text className="text-[#9AA0A6]">
                          ({e.sets.length} sets)
                        </Text>
                      </Text>
                    ))}
                    {w.entries.length > 2 && (
                      <Text className="text-[#9AA0A6]">… and more</Text>
                    )}
                  </View>

                  {/* Hint */}
                  <Text className="text-[#9AA0A6] mt-3">
                    Tap to view details
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ===== Details modal ===== */}
      <Modal
        visible={!!active}
        animationType="slide"
        transparent
        onRequestClose={() => setActive(null)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#2B2B2B] rounded-t-2xl p-4 max-h-[85vh]">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[#FFD100] text-lg font-extrabold">
                  {active?.dayName || "Workout"}
                </Text>
                <Text className="text-[#CFCFCF]">{formatDate(active?.date)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActive(null)}
                className="px-3 py-1 rounded-lg bg-[#333533]"
              >
                <Text className="text-white font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            {/* Summary in modal (no volume) */}
            <View className="flex-row gap-4 mt-3">
              <Text className="text-[#CFCFCF]">
                Exercises:{" "}
                <Text className="text-[#F4F4F4] font-bold">
                  {active?.entries?.length ?? 0}
                </Text>
              </Text>
              <Text className="text-[#CFCFCF]">
                Sets:{" "}
                <Text className="text-[#F4F4F4] font-bold">
                  {active?.summary?.completedSets ?? 0}/
                  {active?.summary?.totalSets ?? 0}
                </Text>
              </Text>
            </View>

            {/* Full exercises list */}
            <ScrollView className="mt-4">
              <View className="space-y-3">
                {active?.entries?.map((e) => (
                  <View
                    key={e.exerciseId}
                    className="bg-[#1F1F1F] rounded-xl border border-[#000]/40"
                  >
                    <View className="px-4 py-3 border-b border-[#000]/40">
                      <Text className="text-[#F4F4F4] font-bold">{e.name}</Text>
                      <Text className="text-[#9AA0A6]">{e.sets.length} sets</Text>
                    </View>
                    <View className="px-4 py-2">
                      {e.sets.map((s, idx) => (
                        <View
                          key={idx}
                          className={`flex-row justify-between py-2 ${
                            idx > 0 ? "border-t border-[#000]/40" : ""
                          }`}
                        >
                          <Text className="text-[#CFCFCF]">Set {idx + 1}</Text>
                          <Text className="text-[#F4F4F4]">
                            {s.weight ?? 0} kg × {s.reps ?? 0} reps
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
              <View className="h-6" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
