import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";

export default function ExercisePickerModal({
    visible,
    onClose,
    currentDay,
    log,
    addExerciseToLog,
    getEffectiveLastMax,
}){
    return (
        <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={onClose}
        >
        <View className="flex-1 bg-black/60 items-center justify-center px-4">
            <View className="w-full max-w-[560px] rounded-2xl bg-card border border-border p-4">
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-primary text-lg font-extrabold">
                Pick exercise — {currentDay?.name}
                </Text>
                <TouchableOpacity
                onPress={onClose}
                className="px-3 py-1 rounded-lg bg-field border border-fieldBorder"
                >
                <Text className="text-text font-bold">Close</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[70vh]">
                <View className="bg-bg rounded-xl overflow-hidden border border-border">
                {(currentDay?.exercises ?? []).map((ex, i) => {
                    const disabled = !!log[ex.id];
                    return (
                    <TouchableOpacity
                        key={ex.id}
                        disabled={disabled}
                        onPress={() => {
                        addExerciseToLog(ex);
                        onClose();
                        }}
                        className={`px-3 py-3 ${i > 0 ? "border-t border-border" : ""} ${
                        disabled ? "opacity-50" : "active:opacity-80"
                        }`}
                    >
                        <View className="flex-row items-center justify-between">
                        <Text className="text-text">{ex.name}</Text>
                        <Text className="text-muted text-xs">
                            planned: {ex.sets} • max {getEffectiveLastMax(ex)}kg
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
