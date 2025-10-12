// app/(screens)/tracking/trainingHistory.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, RefreshControl, Alert, Platform } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppLogo from "../../../assets/components/ui/AppLogo";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";

import { getMyPlan } from "../../../assets/api/plan.api";
import { listHistory, getWorkoutById } from "../../../assets/api/workouts.api";
import { getTraineeHistory, getTraineeWorkout, getTraineePlan } from "../../../assets/api/coach.api";

import { safeAlert } from "../../../assets/utils/tracking";



/* ===== Helpers ===== */
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// הפקת מיפוי exerciseId -> name מתוך התכנית הנוכחית (אם יש)
function buildNameMap(plan) {
  const map = {};
  (plan?.days ?? []).forEach(day => {
    const arr = day.items ?? day.exercises ?? [];
    arr.forEach(it => {
      if (it?.exerciseId) map[String(it.exerciseId)] = it.name ?? "";
    });
  });
  return map;
}

export default function TrainingHistory() {
  const [token, setToken] = useState("");
  const [plan, setPlan] = useState(null);
  const [nameById, setNameById] = useState({});

  //#################################################################################//
  const { traineeId: _traineeId, traineeName } = useLocalSearchParams();
  const traineeId = Array.isArray(_traineeId) ? _traineeId[0] : _traineeId;
  const isCoachView = !!traineeId; 


  // רשימת אימונים סגורים
  const [items, setItems] = useState([]); // [{ _id, date:'YYYY-MM-DD', planDay, ... }]
  const [total, setTotal] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState(null); // מסמך מלא של אימון בודד
  const [loadingDetail, setLoadingDetail] = useState(false);

  // טעינת טוקן
  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("accessToken");
      setToken(t || "");
    })();
  }, []);

  // טעינת תכנית (כדי להציג שמות תרגילים אם קיימים)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const p = isCoachView
          ? await getTraineePlan({ token, traineeId })
          : await getMyPlan({ token });
        setPlan(p || null);
        setNameById(buildNameMap(p || null));
      } catch {
        setPlan(null);
        setNameById({});
      }
    })();
  }, [token, isCoachView, traineeId]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { items: rows = [], total: t = 0 } = isCoachView
        ? await getTraineeHistory({ token, traineeId, skip: 0, limit: 50 })
        : await listHistory({ token, skip: 0, limit: 50 });
      setItems(rows);
      setTotal(t);
    } catch (e) {
      if (Platform.OS === "web") alert(`Failed to load history: ${e?.message || ""}`);
      else Alert.alert("Failed to load history", e?.message || "");
    } finally {
      setLoading(false);
    }
  }, [token, isCoachView, traineeId]);

  // טעינת היסטוריה בהתחלה
  useEffect(() => { if (token) fetchHistory(); }, [token, fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchHistory(); }
    finally { setRefreshing(false); }
  }, [fetchHistory]);

  // מיון יורד לפי תאריך (ה־API כבר מחזיר ממוין, אבל נוודא)
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const byDate = String(b.date || "").localeCompare(String(a.date || ""));
      if (byDate !== 0) return byDate;
      const sa = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      const sb = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      return sa - sb; // גם כאן – חדש קודם
    });
  }, [items]);

  // פתיחת מודאל: משיכת מסמך מלא של אימון לפי ID
  const openDetail = useCallback(async (workoutId) => {
    if (!token || !workoutId) return;
    setLoadingDetail(true);
    try {
      const full = isCoachView
      ? await getTraineeWorkout({ token, traineeId, workoutId })
      : await getWorkoutById({ token, workoutId });
      // התאמות קטנות ל־UI:
      // session.status === 'closed', session.planDay, session.exercises: [{exerciseId, sets:[{setNumber,reps,weight}]}]
      const entries = (full?.exercises || []).map(e => {
        const id = String(e.exerciseId);
        return {
          exerciseId: e.exerciseId,
          name: (e.name ?? nameById[id]) || `Exercise ${id.slice(-4)}`,
          sets: (e.sets || []).map(s => ({ weight: s?.weight ?? 0, reps: s?.reps ?? 0 })),
        };
      });

      const summary = {
        totalSets: entries.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0),
        completedSets: entries.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0), // כרגע אין "incomplete" בהיסטוריה
      };

      const decorated = {
        _id: full?._id,
        date: full?.date,                  // YYYY-MM-DD מהשרת
        dayName: full?.planDay ? `Day ${full.planDay}` : "Workout",
        entries,
        summary,
      };

      setActive(decorated);
    } catch (e) {
      safeAlert("Open workout failed", e?.message || "");
    } finally {
      setLoadingDetail(false);
    }
  }, [token, nameById, isCoachView, traineeId]);




  return (
    <View className="flex-1 bg-bg"> 
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />

      {/* Page title */}
      <View className="px-4 pt-5">
        <Text className="text-text text-2xl font-extrabold">
          {isCoachView ? `Training History — ${traineeName || ""}` : "Training History"}
        </Text>
        <Text className="text-muted mt-1">
          {isCoachView ? "Closed sessions for this trainee." : "Your finished sessions at a glance."}
        </Text>
      </View>

      {/* List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" />
            <Text className="text-muted mt-3">Loading…</Text>
          </View>
        ) : sorted.length === 0 ? (
          <Text className="text-muted text-center mt-10">No workouts yet.</Text>
        ) : (
          <View className="pb-10 gap-3">
            {sorted.map((w) => {
              // השרת מחזיר _id, date: 'YYYY-MM-DD', planDay
              const dayName = w?.planDay ? `Day ${w.planDay}` : null;
              // ברשימה אין לנו סיכום סטים בלי לפתוח פרטים → נציג ספירה בסיסית אם קיימת (לא חובה)
              return (
                <TouchableOpacity
                  key={String(w._id)}
                  onPress={() => openDetail(String(w._id))}
                  activeOpacity={0.92}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-text font-bold text-base">
                      {formatDate(w.date)}
                    </Text>
                    {!!dayName && (
                      <View className="px-3 py-1 rounded-full bg-primary">
                        <Text className="text-onPrimary font-extrabold text-xs">
                          {dayName}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* אפשר להשאיר את שורת התקציר כמו בדמו, אך ללא ספירת סטים (כי זה דורש פרטים) */}
                  <View className="flex-row gap-4 mt-2">
                    <Text className="text-muted">
                      Status: <Text className="text-text font-bold">closed</Text>
                    </Text>
                  </View>

                  <Text className="text-muted mt-3">Tap to view details</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Details modal */}
      <Modal
        visible={!!active}
        animationType="fade"
        transparent
        onRequestClose={() => setActive(null)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-4">
          <View className="w-full max-w-[560px] rounded-2xl bg-card border border-border p-4 max-h-[85vh]">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-primary text-lg font-extrabold">
                  {active?.dayName || "Workout"}
                </Text>
                <Text className="text-muted">{formatDate(active?.date)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActive(null)}
                className="px-3 py-1 rounded-lg bg-field border border-fieldBorder"
              >
                <Text className="text-text font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            {/* טעינת פרטי אימון */}
            {loadingDetail ? (
              <View className="items-center justify-center py-10">
                <ActivityIndicator size="large" />
                <Text className="text-muted mt-3">Loading workout…</Text>
              </View>
            ) : (
              <>
                <View className="flex-row gap-4 mt-3">
                  <Text className="text-muted">
                    Exercises:{" "}
                    <Text className="text-text font-bold">
                      {active?.entries?.length ?? 0}
                    </Text>
                  </Text>
                  <Text className="text-muted">
                    Sets:{" "}
                    <Text className="text-text font-bold">
                      {active?.summary?.completedSets ?? 0}/
                      {active?.summary?.totalSets ?? 0}
                    </Text>
                  </Text>
                </View>

                <ScrollView className="mt-4">
                  <View className="gap-3">
                    {(active?.entries ?? []).map((e) => (
                      <View
                        key={String(e.exerciseId)}
                        className="bg-bg rounded-xl border border-border"
                      >
                        <View className="px-4 py-3 border-b border-border">
                          <Text className="text-text font-bold">
                            {e.name || String(e.exerciseId)}
                          </Text>
                          <Text className="text-muted">{e.sets.length} sets</Text>
                        </View>

                        <View className="px-4 py-2">
                          {e.sets.map((s, idx) => (
                            <View
                              key={idx}
                              className={`flex-row justify-between py-2 ${idx > 0 ? "border-t border-border" : ""}`}
                            >
                              <Text className="text-muted">Set {idx + 1}</Text>
                              <Text className="text-text">
                                {s.weight ?? 0} kg × {s.reps ?? 0} reps
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                  <View className="h-3" />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomTabs role={isCoachView ? 30 : 20} currentHref="/(screens)/tracking/trainingHistory" />
    </View>
  );
}
