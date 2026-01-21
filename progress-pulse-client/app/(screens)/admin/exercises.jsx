// app/(screens)/admin/exercises.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TextInput, RefreshControl, TouchableOpacity, Alert, Platform,
} from "react-native";
import { Stack } from "expo-router";
import AppLogo from "../../../assets/components/ui/AppLogo";
import BottomTabs from "../../../assets/components/navigation/BottomTabs";
import CreateExerciseModal from "../../../assets/components/screens/admin/CreateExerciseModal";
import { listExercisesAPI, deleteExerciseAPI, getExerciseStatsAPI } from "../../../assets/api/exercises.api";

// Keep in sync with server labels for client-side filter
const MUSCLE_LABELS = ['Abs','Back','Biceps','Chest','Forearms','Legs','Shoulders','Triceps'];

function ExerciseRow({ item, onDelete }) {
  return (
    <View className="p-4 mb-3 rounded-2xl bg-card border border-border">
      <Text className="text-base font-bold text-text">{item.name}</Text>
      <Text className="text-xs text-muted mt-1">
        Muscle: {item.muscle || "-"} • Type: {item.type || "-"} • Equipment: {item.equipment || "-"}
      </Text>

      <View className="flex-row gap-2 mt-3">
        <TouchableOpacity
          onPress={() => onDelete(item)}
          className="px-3 py-2 rounded-xl bg-error"
        >
          <Text className="text-onPrimary font-semibold">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminExercisesScreen() {
  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState(""); // "" = all
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((ex) => {
      const okMuscle = muscleFilter ? ex.muscle === muscleFilter : true;
      const okQuery =
        !q ||
        ex.name?.toLowerCase().includes(q) ||
        ex.equipment?.toLowerCase().includes(q) ||
        ex.type?.toLowerCase().includes(q);
      return okMuscle && okQuery;
    });
  }, [list, query, muscleFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [items, st] = await Promise.all([
        listExercisesAPI({ muscle: muscleFilter || undefined, query }),
        getExerciseStatsAPI().catch(() => null),
      ]);
      setList(Array.isArray(items) ? items.map((x) => ({ id: String(x._id || x.id || ""), ...x })) : []);
      setStats(st);
    } catch (e) {
      setError(e?.message || "Failed to load exercises");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [muscleFilter, query]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  function confirmDelete(title, message) {
    return new Promise((resolve) => {
      if (Platform.OS === "web") {
        const ok = window.confirm(`${title}\n\n${message}`);
        return resolve(ok);
      }
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Delete", style: "destructive", onPress: () => resolve(true) },
      ]);
    });
  }

  const handleDelete = useCallback(async (ex) => {
    const ok = await confirmDelete("Delete exercise?", `This will remove "${ex?.name}".`);
    if (!ok) return;
    try {
      await deleteExerciseAPI(ex.id);
      setList((prev) => prev.filter((i) => i.id !== ex.id));
    } catch (e) {
      Alert.alert("Delete failed", e?.message || "Unexpected error");
    }
  }, []);

  const StatBadge = ({ label, value }) => (
    <View className="px-3 py-2 rounded-xl bg-card border border-border">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-lg font-bold text-text">{value}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo />,
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />

      {/* Title + Actions */}
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-extrabold text-text">Admin • Exercises</Text>
          <TouchableOpacity
            onPress={() => setCreateOpen(true)}
            className="px-4 py-3 rounded-xl bg-primary"
          >
            <Text className="text-onPrimary font-bold">Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name/type/equipment"
          placeholderTextColor="#667085"
          className="w-full px-4 py-3 rounded-xl bg-field border border-fieldBorder text-text mb-3"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setMuscleFilter("")}
              className={`px-3 py-2 rounded-xl border ${!muscleFilter ? "bg-secondary border-border" : "bg-card border-border"}`}
            >
              <Text className={`${!muscleFilter ? "text-onPrimary" : "text-text"}`}>All</Text>
            </TouchableOpacity>

            {MUSCLE_LABELS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMuscleFilter(m === muscleFilter ? "" : m)}
                className={`px-3 py-2 rounded-xl border ${m === muscleFilter ? "bg-secondary border-border" : "bg-card border-border"}`}
              >
                <Text className={`${m === muscleFilter ? "text-onPrimary" : "text-text"}`}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {!!error && <Text className="text-error">{error}</Text>}

        {/* (Optional) Tiny stats bar */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            <View className="flex-row gap-2">
              {Object.entries(stats).map(([k, v]) => (
                <StatBadge key={k} label={k} value={v} />
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* List */}
      <ScrollView
        className="px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
          <Text className="text-center text-muted">Loading…</Text>
        ) : filtered.length === 0 ? (
          <Text className="text-center text-muted">No exercises found</Text>
        ) : (
          filtered.map((ex) => <ExerciseRow key={ex.id} item={ex} onDelete={handleDelete} />)
        )}
      </ScrollView>

      {/* Create modal */}
      <CreateExerciseModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      <BottomTabs role={10} currentHref="/(screens)/admin/exercises" />
    </View>
  );
}
