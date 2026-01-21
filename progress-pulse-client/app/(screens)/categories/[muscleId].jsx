// app/(screens)/categories/[muscleId].jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MUSCLES } from '../../../assets/data/muscles';
import { listExercises } from '../../../assets/api/plan.api';
import { planDraft } from '../../../assets/lib/planDraft';

export default function ExercisesByMusclePicker() {
  const router = useRouter();
  const { muscleId, targetDayId } = useLocalSearchParams();
  const muscle = MUSCLES.find((m) => m.id === muscleId);

  // auth
  const [token, setToken] = useState('');

  // search (debounced)
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // data
  const [items, setItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // loading
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // prevent overlapping pagination calls
  const pagingInFlightRef = useRef(false);

  // load token once
  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('accessToken');
      setToken(t || '');
    })();
  }, []);

  // core fetch (used by both first page and pagination)
  const fetchPage = useCallback(
    async ({ nextSkip, replace }) => {
      if (!token || !muscleId) return;

      try {
        if (replace) setLoading(true);
        else {
          if (pagingInFlightRef.current) return;
          pagingInFlightRef.current = true;
          setLoadingMore(true);
        }

        const res = await listExercises({
          token,
          muscle: muscleId,                     // slug; server normalizes to label
          query: debouncedQuery || undefined,
          limit: 30,
          skip: nextSkip,
        });

        const list = Array.isArray(res) ? res : res?.items || [];
        const tot = Array.isArray(res) ? null : res?.total ?? null;

        setItems((prev) => {
          const merged = replace ? list : [...prev, ...list];
          // unique by id
          const seen = new Set();
          return merged.filter((it) => {
            const k = String(it._id || it.id);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        });

        setSkip(nextSkip + list.length);
        setTotal(tot);

        if (tot != null) {
          setHasMore(nextSkip + list.length < tot);
        } else {
          setHasMore(list.length === 30); // if API doesn't send total
        }
      } catch (e) {
        console.warn('listExercises error:', e?.status || '', e?.message || e);
        if (e?.status === 401) {
          Alert.alert('Session expired', 'Please log in again.');
        } else if (e?.message) {
          Alert.alert('Error', e.message);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        pagingInFlightRef.current = false;
      }
    },
    [token, muscleId, debouncedQuery]
  );

  // first page whenever token / muscle / search changes
  useEffect(() => {
    if (!token || !muscleId) return;
    setItems([]);
    setSkip(0);
    setTotal(null);
    setHasMore(true);
    // IMPORTANT: never block the initial load with in-flight flags
    fetchPage({ nextSkip: 0, replace: true });
  }, [token, muscleId, debouncedQuery, fetchPage]);

  const handleEndReached = () => {
    if (loading || loadingMore) return;
    if (!hasMore) return;
    fetchPage({ nextSkip: skip, replace: false });
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
                const id = item._id || item.id;
                planDraft.addExercise(targetDayId, {
                  id,
                  name: item.name,
                  muscle: muscle?.name,
                  muscleId,
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
