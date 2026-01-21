// app/(screens)/tracking/components/ExercisePickerModal.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";

export default function ExercisePickerModal({ visible, onClose, day, selectedIds, onPick }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center px-4">
        <View className="w-full max-w-[560px] rounded-2xl bg-card border border-border p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-primary text-lg font-extrabold">
              Pick exercise — {day?.name}
            </Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1 rounded-lg bg-field border border-fieldBorder">
              <Text className="text-text font-bold">Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-[70vh]">
            <View className="bg-bg rounded-xl overflow-hidden border border-border">
              {(day?.exercises ?? []).map((ex, i) => {
                const idStr = String(ex.exerciseId || ex.id);
                const disabled = selectedIds?.has?.(idStr);
                return (
                  <TouchableOpacity
                    key={idStr}
                    disabled={!!disabled}
                    onPress={() => { onPick(idStr); onClose(); }}
                    className={`px-3 py-3 ${i > 0 ? "border-t border-border" : ""} ${
                      disabled ? "opacity-50" : "active:opacity-80"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-text">{ex.name}</Text>
                      <Text className="text-muted text-xs">
                        planned: {ex.sets} • max {ex.lastMaxKg ?? 0}kg
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
  );
}
