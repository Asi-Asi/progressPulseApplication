// app/(screens)/tracking/components/FinishButton.jsx
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";

export default function FinishButton({ offsetBottom, disabled, onPress }) {
  return (
    <View style={{ position: "absolute", left: 16, right: 16, bottom: offsetBottom }}>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        className={`h-12 rounded-xl items-center justify-center ${
          disabled ? "bg-card opacity-60" : "bg-primary"
        }`}
      >
        <Text className={`${disabled ? "text-muted" : "text-onPrimary font-extrabold"}`}>Finish Workout</Text>
      </TouchableOpacity>
    </View>
  );
}
