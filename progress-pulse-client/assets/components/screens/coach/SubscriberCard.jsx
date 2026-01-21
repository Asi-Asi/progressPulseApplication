// assets/components/screens/coach/SubscriberCard.jsx
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

function RowBadge({ label }) {
  return (
    <View className="px-3 py-1 rounded-full bg-primary/90">
      <Text className="text-onPrimary font-extrabold text-xs">{label}</Text>
    </View>
  );
}

export default function SubscriberCard({ s, onViewHistory, onRevoke, formatDateEN }) {
  return (
    <TouchableOpacity
      onPress={() => onViewHistory(s)}
      activeOpacity={0.9}
      className="bg-card rounded-xl border border-border p-4"
    >
      <View className="flex-row gap-3">
        {s.avatarUrl ? (
          <Image source={{ uri: s.avatarUrl }} className="w-12 h-12 rounded-full" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-field border border-fieldBorder items-center justify-center">
            <Text className="text-primary font-extrabold">
              {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="text-text font-bold text-base flex-1 pr-3">{s.name}</Text>
            <RowBadge label="approved" />
          </View>

          <Text className="text-muted mt-0.5">{s.email}</Text>

          <View className="flex-row flex-wrap gap-x-6 gap-y-1 mt-2">
            <Text className="text-[#6B7280]">
              Since: <Text className="text-text font-bold">{formatDateEN(s.since)}</Text>
            </Text>
            <Text className="text-[#6B7280]">
              Last workout:{" "}
              <Text className="text-text font-bold">
                {s.lastWorkoutDate ? formatDateEN(s.lastWorkoutDate) : "—"}
              </Text>
            </Text>
          </View>

          <View className="mt-3 flex-row gap-8">
            <TouchableOpacity
              onPress={() => onViewHistory(s)}
              className="self-start px-3 py-1.5 rounded-lg bg-field border border-fieldBorder"
            >
              <Text className="text-text font-bold text-xs">View history</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onRevoke(s)}
              className="self-start px-3 py-1.5 rounded-lg bg-field border border-fieldBorder"
            >
              <Text className="text-text font-bold text-xs">Revoke</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
