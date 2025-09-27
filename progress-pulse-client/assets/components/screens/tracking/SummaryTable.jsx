import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, Alert, Platform } from "react-native";
import { workoutsApi } from "../../../api/workouts.api";

const safeAlert = (title, msg = "") => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n${msg}`);
    else console.log("ALERT:", title, msg);
  } else {
    Alert.alert(title, msg);
  }
};

/**
 * Props:
 * - token: string
 * - sessionId?: string
 * - fallbackExercises?: Array<{ id|exerciseId, name?, sets }>
 * - nameById?: Record<string,string>
 */
export default function SummaryTable({ token, sessionId, fallbackExercises = [], nameById = {} }) {
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [planned, setPlanned] = useState([]);
  const [maxMap, setMaxMap] = useState({});

  useEffect(() => {
    let mounted = true;
    if (!sessionId || !token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const view = await workoutsApi.getSessionView({ token, sessionId });
        if (!mounted) return;
        setPlanned(view?.session?.planned || []);
        setMaxMap(view?.maxByExercise || {});
      } catch (e) {
        if (!mounted) return;
        console.warn("SummaryTable fetch error:", e?.message || e);
        safeAlert("Error", e?.message || "Failed to load session summary");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token, sessionId]);

  const rows = useMemo(() => {
    if (sessionId) {
      return (planned || []).map((p) => {
        const id = String(p.exerciseId);
        return {
          key: id,
          label: nameById[id] || id,
          sets: Number(p.sets) || 0,
          max: maxMap[id] ?? 0,
        };
      });
    }
    // fallback (before session available)
    return (fallbackExercises || []).map((ex) => {
      const id = String(ex.id || ex.exerciseId);
      return {
        key: id,
        label: ex.name || nameById[id] || id,
        sets: Number(ex.sets) || 0,
        max: 0,
      };
    });
  }, [sessionId, planned, maxMap, fallbackExercises, nameById]);

  return (
    <View className="mt-2 bg-card rounded-xl overflow-hidden border border-border">
      <View className="flex-row">
        <View className="flex-1 border-r border-border px-3 py-2">
          <Text className="text-text font-bold underline">Exercise</Text>
        </View>
        <View className="w-20 border-r border-border items-center px-3 py-2">
          <Text className="text-text font-bold">Sets</Text>
        </View>
        <View className="w-28 items-center px-3 py-2">
          <Text className="text-text font-bold">Max (kg)</Text>
        </View>
      </View>

      {loading ? (
        <View className="items-center justify-center py-12">
          <ActivityIndicator />
          <Text className="text-muted mt-2">Loading…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View className="items-center justify-center py-8">
          <Text className="text-muted">No exercises planned for this day.</Text>
        </View>
      ) : (
        rows.map((r) => (
          <View key={r.key} className="flex-row border-t border-border">
            <View className="flex-1 px-3 py-3 border-r border-border">
              <Text className="text-text">{r.label}</Text>
            </View>
            <View className="w-20 items-center justify-center border-r border-border">
              <Text className="text-muted">#{r.sets}</Text>
            </View>
            <View className="w-28 items-center justify-center">
              <Text className="text-text font-bold">{r.max}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
