// app/(screens)/tracking/components/LogTable.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COL = { EX_MIN: 240, SET_W: 72, NUM_W: 96, BTN_W: 48 };

export default function LogTable({
    items, onAddSet, onRemoveSet, onUpdateSet, onRemoveExercise,
  }) {
  const rows = items || [];

  return (

    
    <View className="mt-4 bg-card rounded-xl border border-border">
      <View className="border-t border-border">
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: COL.EX_MIN + COL.SET_W + COL.NUM_W + COL.NUM_W + COL.BTN_W }}>
            {/* header */}
            <View className="flex-row bg-field border-b border-fieldBorder">
              <View className="px-3 py-2 border-r border-fieldBorder" style={{ minWidth: COL.EX_MIN, flexGrow: 1 }}>
                <Text className="text-text font-bold">Exercise</Text>
              </View>
              <View className="items-center px-3 py-2 border-r border-fieldBorder" style={{ width: COL.SET_W }}>
                <Text className="text-text font-bold">Set</Text>
              </View>
              <View className="items-center px-3 py-2 border-r border-fieldBorder" style={{ width: COL.NUM_W }}>
                <Text className="text-text font-bold">Reps</Text>
              </View>
              <View className="items-center px-3 py-2 border-r border-fieldBorder" style={{ width: COL.NUM_W }}>
                <Text className="text-text font-bold">Weight</Text>
              </View>
              <View className="items-center px-1 py-2" style={{ width: COL.BTN_W }} />
            </View>

            {/* rows */}
            {rows.length === 0 ? (
              <Text className="text-muted px-4 py-3">No exercises added yet.</Text>
            ) : (
              rows.map(({ exerciseId, name, sets }) => (
                <View key={String(exerciseId)} className="border-t border-border">
                  {sets.map((s, idx) => (
                    <View key={idx} className="flex-row items-stretch">
                      {idx === 0 ? (
                        <View className="px-3 py-3 border-r border-border" style={{ minWidth: COL.EX_MIN, flexGrow: 1 }}>
                          <Text className="text-text" style={{ flexShrink: 1, flexWrap: "wrap", lineHeight: 18 }}>
                            {name || String(exerciseId)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => onRemoveExercise(exerciseId)}
                            className="mt-2 self-start px-2 py-1 rounded-lg bg-field border border-fieldBorder"
                          >
                            <Text className="text-text text-xs">remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="border-r border-border" style={{ minWidth: COL.EX_MIN, flexGrow: 1 }} />
                      )}

                      <View className="items-center justify-center border-r border-border" style={{ width: COL.SET_W }}>
                        <Text className="text-text">set {idx + 1}</Text>
                      </View>

                      <View className="justify-center border-r border-border px-2 py-2" style={{ width: COL.NUM_W }}>
                        <TextInput
                          value={String(s.reps ?? "")}
                          onChangeText={(v) => onUpdateSet(exerciseId, idx, "reps", v.replace(/[^0-9]/g, ""))}
                          keyboardType="numeric"
                          inputMode="numeric"
                          placeholder="0"
                          placeholderTextColor="#667085"
                          className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-10"
                        />
                      </View>

                      <View className="justify-center border-r border-border px-2 py-2" style={{ width: COL.NUM_W }}>
                        <TextInput
                          value={String(s.weight ?? "")}
                          onChangeText={(v) => onUpdateSet(exerciseId, idx, "weight", v.replace(/[^0-9.]/g, ""))}
                          keyboardType="numeric"
                          inputMode="decimal"
                          placeholder="0"
                          placeholderTextColor="#667085"
                          className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-10"
                        />
                      </View>

                      <View className="items-center justify-center px-1" style={{ width: COL.BTN_W }}>
                        <TouchableOpacity
                          onPress={() => onRemoveSet(exerciseId, idx)}
                          className="px-2 py-1 rounded-md bg-field border border-fieldBorder"
                          accessibilityLabel={`Remove set ${idx + 1}`}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#2C2C2C" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <View className="flex-row border-t border-border">
                    <View className="border-r border-border" style={{ minWidth: COL.EX_MIN, flexGrow: 1 }} />
                    <TouchableOpacity
                      onPress={() => onAddSet(exerciseId)}
                      className="items-center justify-center border-r border-border"
                      style={{ width: COL.SET_W }}
                    >
                      <Text className="text-primary font-bold">+ set</Text>
                    </TouchableOpacity>
                    <View className="border-r border-border" style={{ width: COL.NUM_W }} />
                    <View className="border-r border-border" style={{ width: COL.NUM_W }} />
                    <View style={{ width: COL.BTN_W }} />
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
