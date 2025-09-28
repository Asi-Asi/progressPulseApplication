// assets/components/screens/coach/CoachCodeCard.jsx
import React from "react";
import { View, Text, TouchableOpacity, Share, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { copyToClipboard } from "./coach.helpers";

export default function CoachCodeCard({ coachCode, onRegenerate }) {
  const onShare = async () => {
    const message = `Join my coaching on Progress Pulse.\nCoach code: ${coachCode ?? "—"}`;
    try {
      if (Platform.OS === "web") {
        if (navigator?.share) await navigator.share({ title: "Coach Code", text: message });
        else alert(message);
      } else {
        await Share.share({ message });
      }
    } catch {}
  };

  return (
    <View className="bg-card rounded-xl border border-border px-4 py-3 mb-3">
      <Text className="text-text font-extrabold mb-2">Your coach code</Text>

      <View className="flex-row flex-wrap gap-2 items-stretch">
        <View className="flex-row items-center px-3 rounded-lg bg-field border border-fieldBorder h-11 flex-1">
          <Text numberOfLines={1} className="text-primary font-extrabold tracking-wider">
            {coachCode ?? "—"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => coachCode && copyToClipboard(coachCode)}
          className="px-3 rounded-lg bg-field border border-fieldBorder h-11 items-center justify-center"
        >
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons name="content-copy" size={16} color="#2C2C2C" />
            <Text className="text-text font-bold">Copy</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShare}
          className="px-3 rounded-lg bg-field border border-fieldBorder h-11 items-center justify-center"
        >
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons name="share-variant" size={16} color="#2C2C2C" />
            <Text className="text-text font-bold">Share</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRegenerate}
          className="px-3 rounded-lg bg-primary h-11 items-center justify-center"
        >
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons name="reload" size={16} color="#0B0F12" />
            <Text className="text-onPrimary font-extrabold">New</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text className="text-muted mt-2 text-xs">
        Share this code with trainees. They’ll send you a join request using it.
      </Text>
    </View>
  );
}
