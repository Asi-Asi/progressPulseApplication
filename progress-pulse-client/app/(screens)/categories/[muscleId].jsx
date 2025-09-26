// app/(screens)/categories/[muscleId].jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MUSCLES } from '../../../assets/data/muscles';          // קטגוריות נשאר סטטי
import { listExercises } from '../../../assets/api/plan.api';     // API ל־DB
import { planDraft } from '../../../assets/lib/planDraft';

export default function ExercisesByMusclePicker() {
  const router = useRouter();
  const { muscleId, targetDayId } = useLocalSearchParams();

  const muscle = MUSCLES.find((m) => m.id === muscleId);
  const [accessToken, setAccessToken] = useState('');
  const [query, setQuery] = useState('');

  // נתונים שמגיעים מהשרת
  const [items, setItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(null);

  // מצבי טעינה
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // שלוף טוקן
  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => setAccessToken(t || ''));
  }, []);

  // בכל שינוי של שריר/חיפוש — אפס פאג'ינציה ושלוף מחדש
  useEffect(() => {
    if (!accessToken || !muscleId) return;
    setSkip(0);
    setItems([]);
    setTotal(null);
    fetchPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, muscleId, query]);

  const fetchPage = useCallback(
    async (nextSkip, replace = false) => {
      try {
        if (replace) setLoading(true);
        else setLoadingMore(true);

        const res = await listExercises({
          token: accessToken,
          muscle: muscleId,                // slug קטן (abs/back/…); השרת מנרמל
          query: query.trim() || undefined,
          limit: 30,
          skip: nextSkip,
        });

        // תמיכה בשני פורמטים: מערך ישיר או {items,total}
        const list = Array.isArray(res) ? res : res?.items || [];
        const tot = Array.isArray(res) ? null : res?.total ?? null;

        setItems((prev) => {
          const merged = replace ? list : [...prev, ...list];
          const seen = new Set();
          return merged.filter((it) => {
            const k = String(it._id || it.id);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        });
        setTotal(tot);
        setSkip(nextSkip + list.length);
      } catch (e) {
        console.warn('listExercises error:', e?.message || e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [accessToken, muscleId, query]
  );

  const handleEndReached = () => {
    if (loading || loadingMore) return;
    if (total != null && items.length >= total) return; // אין עוד נתונים
    fetchPage(skip, false);
  };

  const data = useMemo(() => items, [items]);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          title: muscle ? muscle.name : 'Exercises',
          headerStyle: { backgroundColor: '#FDFBFA' },
          headerTintColor: '#007BFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <View className="px-4 pt-5 pb-4">
        <Text className="text-text text-2xl font-extrabold">
          {muscle ? `${muscle.name} Exercises` : 'Exercises'}
        </Text>
        <Text className="text-muted mt-1">Choose an exercise to add to your plan.</Text>

        {/* Search */}
        <View className="mt-4">
          <View className="flex-row items-center rounded-2xl bg-field border border-fieldBorder px-3">
            <MaterialCommunityIcons name="magnify" size={20} color="#667085" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name / type / equipment"
              placeholderTextColor="#667085"
              className="flex-1 px-2 py-3 text-text"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} className="px-2 py-2">
                <MaterialCommunityIcons name="close" size={18} color="#667085" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* מצב טעינה ראשון */}
      {loading && items.length === 0 ? (
        <View className="items-center justify-center py-16">
          <ActivityIndicator />
          <Text className="text-muted mt-3">Loading exercises…</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          onEndReachedThreshold={0.6}
          onEndReached={handleEndReached}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <MaterialCommunityIcons name="dumbbell" size={28} color="#007BFF" />
              <Text className="text-muted mt-2">No exercises match your search.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                const id = item._id || item.id; // מזהה אמיתי מה־DB
                planDraft.addExercise(targetDayId, {
                  id,
                  name: item.name,
                  muscle: muscle?.name, // לתצוגה
                  muscleId,             // לשימוש UI
                  sets: 1,
                });
                router.push('/(screens)/plan');
              }}
              className="rounded-2xl px-4 py-3 bg-card"
              activeOpacity={0.9}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: '#007BFF1A' }}
                  >
                    <MaterialCommunityIcons name="dumbbell" size={20} color="#007BFF" />
                  </View>
                  <View>
                    <Text className="text-text font-semibold">{item.name}</Text>
                    <Text className="text-muted text-xs">
                      {item.type} • {item.equipment}
                    </Text>
                  </View>
                </View>

                <View className="px-3 py-1.5 rounded-full bg-primary">
                  <Text className="text-onPrimary font-bold text-xs">Add</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
