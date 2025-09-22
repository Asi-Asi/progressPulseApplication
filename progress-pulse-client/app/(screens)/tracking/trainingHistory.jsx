// app/(screens)/tracking/training history.jsx
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Stack } from "expo-router";
import AppLogo from "../../../assets/components/ui/AppLogo";
import BottomTabs from "../../../assets/components/navigation/BottomTabs"; // <-- tabs


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
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function TrainingHistory() {
  const [workouts] = useState(DEMO_WORKOUTS);
  const [active, setActive] = useState(null);

  const sorted = useMemo(
    () =>
      [...workouts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [workouts]
  );

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />

      {/* Page title (the old header text) */}
      <View className="px-4 pt-5">
        <Text className="text-text text-2xl font-extrabold">Training History</Text>
        <Text className="text-muted mt-1">Your finished sessions at a glance.</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {sorted.length === 0 ? (
          <Text className="text-muted text-center mt-10">No workouts yet.</Text>
        ) : (
          <View className="pb-10 gap-3">
            {sorted.map((w) => {
              const { totalSets, completedSets } = w.summary || {};
              const firstTwo = w.entries.slice(0, 2);
              return (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => setActive(w)}
                  activeOpacity={0.92}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-text font-bold text-base">
                      {formatDate(w.date)}
                    </Text>
                    {!!w.dayName && (
                      <View className="px-3 py-1 rounded-full bg-primary">
                        <Text className="text-onPrimary font-extrabold text-xs">
                          {w.dayName}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-4 mt-2">
                    <Text className="text-muted">
                      Exercises:{" "}
                      <Text className="text-text font-bold">
                        {w.entries.length}
                      </Text>
                    </Text>
                    <Text className="text-muted">
                      Sets:{" "}
                      <Text className="text-text font-bold">
                        {completedSets ?? 0}/{totalSets ?? 0}
                      </Text>
                    </Text>
                  </View>

                  <View className="mt-3 gap-1">
                    {firstTwo.map((e) => (
                      <Text key={e.exerciseId} className="text-text">
                        • {e.name}{" "}
                        <Text className="text-muted">({e.sets.length} sets)</Text>
                      </Text>
                    ))}
                    {w.entries.length > 2 && (
                      <Text className="text-muted">… and more</Text>
                    )}
                  </View>

                  <Text className="text-muted mt-3">Tap to view details</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Details modal – centered dialog */}
      <Modal
        visible={!!active}
        animationType="fade"
        transparent
        onRequestClose={() => setActive(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-4">
          <View className="w-full max-w-[560px] rounded-2xl bg-card border border-border p-4 max-h-[85vh]">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-primary text-lg font-extrabold">
                  {active?.dayName || "Workout"}
                </Text>
                <Text className="text-muted">{formatDate(active?.date)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActive(null)}
                className="px-3 py-1 rounded-lg bg-field border border-fieldBorder"
              >
                <Text className="text-text font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-4 mt-3">
              <Text className="text-muted">
                Exercises:{" "}
                <Text className="text-text font-bold">
                  {active?.entries?.length ?? 0}
                </Text>
              </Text>
              <Text className="text-muted">
                Sets:{" "}
                <Text className="text-text font-bold">
                  {active?.summary?.completedSets ?? 0}/
                  {active?.summary?.totalSets ?? 0}
                </Text>
              </Text>
            </View>

            <ScrollView className="mt-4">
              <View className="gap-3">
                {active?.entries?.map((e) => (
                  <View
                    key={e.exerciseId}
                    className="bg-bg rounded-xl border border-border"
                  >
                    <View className="px-4 py-3 border-b border-border">
                      <Text className="text-text font-bold">{e.name}</Text>
                      <Text className="text-muted">{e.sets.length} sets</Text>
                    </View>

                    <View className="px-4 py-2">
                      {e.sets.map((s, idx) => (
                        <View
                          key={idx}
                          className={`flex-row justify-between py-2 ${
                            idx > 0 ? "border-t border-border" : ""
                          }`}
                        >
                          <Text className="text-muted">Set {idx + 1}</Text>
                          <Text className="text-text">
                            {s.weight ?? 0} kg × {s.reps ?? 0} reps
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
              <View className="h-3" />
            </ScrollView>
          </View>
        </View>
      </Modal>
      <BottomTabs role={20} currentHref="" />
      
    </View>
  );
}
