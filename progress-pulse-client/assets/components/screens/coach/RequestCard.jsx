// assets/components/screens/coach/RequestCard.jsx
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

export default function RequestCard({ r, onApprove, onDecline, formatDateEN }) {
  return (
    <View className="bg-card rounded-xl border border-border p-4">
      <View className="flex-row gap-3">
        {r.avatarUrl ? (
          <Image source={{ uri: r.avatarUrl }} className="w-12 h-12 rounded-full" />
        ) : (
          <View className="w-12 h-12 rounded-full bg-field border border-fieldBorder items-center justify-center">
            <Text className="text-primary font-extrabold">
              {r.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-text font-bold text-base">{r.name}</Text>
          <Text className="text-muted">{r.email}</Text>
          <Text className="text-[#6B7280] mt-2">
            Requested on: <Text className="text-text font-bold">{formatDateEN(r.requestedOn)}</Text>
          </Text>

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity onPress={() => onApprove(r)} className="px-3 py-2 rounded-lg bg-primary">
              <Text className="text-onPrimary font-extrabold text-xs">Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDecline(r)} className="px-3 py-2 rounded-lg bg-field border border-fieldBorder">
              <Text className="text-text font-bold text-xs">Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
