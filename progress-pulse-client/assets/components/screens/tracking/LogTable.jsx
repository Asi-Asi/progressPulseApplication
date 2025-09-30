// assets/components/screens/tracking/LogTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COL = { EX_MIN: 240, SET_W: 72, NUM_W: 96, BTN_W: 48 };

export default function LogTable({
  items, onAddSet, onRemoveSet, onUpdateSet, onRemoveExercise, disabled,
}) {
  const rows = items || [];

  // key: `${exerciseId}:${idx}`  -> { reps: string, weight: string }
  const [drafts, setDrafts] = useState({});
  const [focusedKey, setFocusedKey] = useState(null);

  const setDraft = (k, field, val) =>
    setDrafts(prev => ({ ...prev, [k]: { ...(prev[k] || {}), [field]: val } }));

  // חתימה יציבה של הנתונים שמגיעים מהשרת (ללא רפרנסים חדשים)
  const serverSignature = useMemo(() => {
    const flat = [];
    rows.forEach(({ exerciseId, sets = [] }) => {
      sets.forEach((s, idx) => flat.push([String(exerciseId), idx, s?.reps ?? "", s?.weight ?? ""]));
    });
    return JSON.stringify(flat);
  }, [rows]);

  // מסנכרנים רק כשהתוכן באמת השתנה; וגם לא דורכים על השדה שבפוקוס
  useEffect(() => {
    const next = {};
    rows.forEach(({ exerciseId, sets = [] }) => {
      sets.forEach((s, idx) => {
        const k = `${exerciseId}:${idx}`;
        next[k] = {
          reps: s?.reps !== undefined && s?.reps !== null ? String(s.reps) : "",
          weight: s?.weight !== undefined && s?.weight !== null ? String(s.weight) : "",
        };
      });
    });

    setDrafts(prev => {
      const merged = { ...prev };
      Object.keys(next).forEach(k => {
        // אל תדרוס אם המשתמש באמצע הקלדה בשדה הזה
        if (k === focusedKey) return;
        const n = next[k];
        const p = prev[k];
        // עדכן רק אם אין טיוטה קיימת או שהתוכן השתנה מהשרת
        if (!p || (p.reps === undefined && p.weight === undefined)) merged[k] = n;
      });
      // מחיקת מפתחות שכבר לא קיימים בשרת
      Object.keys(merged).forEach(k => { if (!(k in next)) delete merged[k]; });
      return merged;
    });
  }, [serverSignature, focusedKey]);

  const commit = (exerciseId, setNumber1) => {
    const idx0 = (Number(setNumber1) || 1) - 1; // שימוש למפתח הטיוטה
    const k = `${exerciseId}:${idx0}`;
    const d = drafts[k] || { reps: "", weight: "" };
    onUpdateSet(exerciseId, setNumber1, d.reps, d.weight);
  };

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
              rows.map(({ exerciseId, name, sets = [] }) => (
                <View key={String(exerciseId)} className="border-t border-border">
                  {sets.map((s, idx) => {
                    const k = `${exerciseId}:${idx}`;
                    const d = drafts[k] || { reps: "", weight: "" };
                    return (
                      <View key={idx} className="flex-row items-stretch">
                        {idx === 0 ? (
                          <View className="px-3 py-3 border-r border-border" style={{ minWidth: COL.EX_MIN, flexGrow: 1 }}>
                            <Text className="text-text" style={{ flexShrink: 1, flexWrap: "wrap", lineHeight: 18 }}>
                              {name || String(exerciseId)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => onRemoveExercise(exerciseId)}
                              disabled={disabled}
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

                        {/* Reps */}
                        <View className="justify-center border-r border-border px-2 py-2" style={{ width: COL.NUM_W }}>
                          <TextInput
                            editable={!disabled}
                            value={d.reps}
                            onFocus={() => setFocusedKey(k)}
                            onBlur={() => setFocusedKey(cur => (cur === k ? null : cur))}
                            onChangeText={(v) => setDraft(k, "reps", v.replace(/[^0-9]/g, ""))}
                            onEndEditing={() => commit(exerciseId, idx + 1)}
                            onSubmitEditing={() => commit(exerciseId, idx + 1)}
                            keyboardType="numeric"
                            inputMode="numeric"
                            placeholder="0"
                            placeholderTextColor="#667085"
                            className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-10"
                          />
                        </View>

                        {/* Weight */}
                        <View className="justify-center border-r border-border px-2 py-2" style={{ width: COL.NUM_W }}>
                          <TextInput
                            editable={!disabled}
                            value={d.weight}
                            onFocus={() => setFocusedKey(k)}
                            onBlur={() => setFocusedKey(cur => (cur === k ? null : cur))}
                            onChangeText={(v) => setDraft(k, "weight", v.replace(/[^0-9.]/g, ""))}
                            onEndEditing={() => commit(exerciseId, idx + 1)}
                            onSubmitEditing={() => commit(exerciseId, idx + 1)}
                            keyboardType="numeric"
                            inputMode="decimal"
                            placeholder="0"
                            placeholderTextColor="#667085"
                            className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-10"
                          />
                        </View>

                        <View className="items-center justify-center px-1" style={{ width: COL.BTN_W }}>
                          <TouchableOpacity
                            onPress={() => onRemoveSet(exerciseId, idx + 1)}
                            disabled={disabled}
                            className="px-2 py-1 rounded-md bg-field border border-fieldBorder"
                            accessibilityLabel={`Remove set ${idx + 1}`}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#2C2C2C" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}

                  <View className="flex-row border-t border-border">
                    <View className="border-r border-border" style={{ minWidth: COL.EX_MIN, flexGrow: 1 }} />
                    <TouchableOpacity
                      onPress={() => onAddSet(exerciseId)}
                      disabled={disabled}
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
