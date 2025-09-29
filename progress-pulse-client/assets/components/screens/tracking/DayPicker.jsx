// app/(screens)/tracking/components/DayPicker.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

export default function DayPicker({ days = [], selectedDayId, onSelect }) {
  return (
    <View className="px-4 pt-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pb-2">
          {days.map((d) => {
            const active = d.id === selectedDayId;
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => onSelect(d.id)}
                className={`h-24 w-24 rounded-2xl border items-center justify-center ${
                  active ? "bg-primary border-primary" : "bg-transparent border-border"
                }`}
              >
                <Text className={`text-center px-1 ${active ? "text-onPrimary font-extrabold" : "text-text"}`}>
                  {d.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
