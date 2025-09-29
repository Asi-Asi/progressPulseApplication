// app/(screens)/tracking/components/SummaryTable.jsx
import React from "react";
import { View, Text } from "react-native";
import { getLastMaxFromLog } from "../../../utils/tracking";

export default function SummaryTable({ day, maxByExercise }) {
  const exercises = day?.exercises ?? [];
  
  const getEffectiveLastMax = (ex) => {
    const fromPlan = ex.lastMaxKg ?? 0;
    const fromPR = maxByExercise?.[ex.id] ?? 0;  
    return Math.max(fromPlan, fromPR);
  };
  return (
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

      {exercises.map((ex) => (
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
  );
}
