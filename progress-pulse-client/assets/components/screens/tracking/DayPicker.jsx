import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { getMyPlan } from "../../../api/plan.api";
import { workoutsApi } from "../../../api/workouts.api";

const safeAlert = (title, msg = "") => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n${msg}`);
    else console.log("ALERT:", title, msg);
  } else {
    Alert.alert(title, msg);
  }
};

export default function DayPicker({
  token,
  selectedDayId,          // string|number
  onSelectDay,            // fn(dayId)
  onSessionLoaded,        // fn({ session, maxByExercise, nameById })
  initialPlan,            // optional UI fallback
}) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null); // { _id(planId), days:[{dayNumber, items/exercises:[{exerciseId, sets, name?}]}] }

  // Map exerciseId → name (support both items/exercises keys)
  const buildNameMap = (p) => {
    const map = {};
    for (const d of p?.days || []) {
      const list = Array.isArray(d.items) ? d.items : (d.exercises || []);
      for (const it of list) {
        const id = String(it.exerciseId);
        if (id && it.name && !map[id]) map[id] = it.name;
      }
    }
    return map;
  };

  // 1) Load plan once (planId + days)
  useEffect(() => {
    if (!token) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const p = await getMyPlan({ token }); // GET /api/plans/me
        if (!mounted) return;
        // normalize: expose planId in consistent key
        const withId = { ...p, planId: p.planId || p._id };
        setPlan(withId);

        // If no day selected yet — auto pick first non-empty day
        if (!selectedDayId) {
          const first = (withId?.days || []).find(d => (d.items || d.exercises || []).length > 0);
          if (first) onSelectDay?.(String(first.dayNumber));
        }
      } catch (e) {
        if (!mounted) return;
        console.warn("DayPicker plan load error:", e?.message || e);
        safeAlert("Error", e?.message || "Failed to load plan");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 2) Open/fetch session for the picked day using ONLY the three routes
  const openSessionForDay = useCallback(async (dayNumber) => {
    if (!token || !plan?.planId) return;
    try {
      setLoading(true);

      // POST /api/workouts/sessions  (open or return today's session for this day)
      const opened = await workoutsApi.createSessionFromPlan({
        token,
        fromPlanId: plan.planId,
        planDay: Number(dayNumber),
      });

      // GET /api/workouts/sessions/:sessionId/view
      const view = await workoutsApi.getSessionView({ token, sessionId: opened._id });

      onSessionLoaded?.({
        session: view.session,
        maxByExercise: view.maxByExercise || {},
        nameById: buildNameMap(plan),
      });

      onSelectDay?.(String(dayNumber));
    } catch (e) {
      console.warn("openSessionForDay error:", e?.message || e);
      safeAlert("Error", e?.message || "Failed to open/fetch session");
    } finally {
      setLoading(false);
    }
  }, [token, plan, onSessionLoaded, onSelectDay]);

  // Days for UI
  const uiDays = useMemo(() => {
    if (plan?.days?.length) {
      return plan.days.map((d) => ({
        id: String(d.dayNumber),
        name: `Day ${d.dayNumber}`,
        hasItems: Array.isArray(d.items) ? d.items.length > 0 : (d.exercises || []).length > 0,
      }));
    }
    if (initialPlan?.days?.length) {
      return initialPlan.days.map((d) => ({
        id: d.id,
        name: d.name,
        hasItems: Array.isArray(d.exercises) && d.exercises.length > 0,
      }));
    }
    return [];
  }, [plan, initialPlan]);

  return (
    <View className="px-4 pt-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pb-2">
          {uiDays.map((d) => {
            const active = String(d.id) === String(selectedDayId);
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => openSessionForDay(d.id)}
                className={`h-24 w-24 rounded-2xl border items-center justify-center ${
                  active ? "bg-primary border-primary" : "bg-transparent border-border"
                }`}
                disabled={loading || !d.hasItems}
                accessibilityRole="button"
                accessibilityLabel={`Open session for ${d.name}`}
              >
                <Text className={`text-center px-1 ${active ? "text-onPrimary font-extrabold" : "text-text"}`}>
                  {d.name}
                </Text>
                {!d.hasItems && (
                  <Text className={`${active ? "text-onPrimary/80" : "text-muted"} text-xs mt-1`}>
                    (empty)
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {loading && (
            <View className="h-24 w-24 rounded-2xl border border-border items-center justify-center">
              <ActivityIndicator />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
