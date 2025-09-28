// app/(screens)/categories/index.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MUSCLES } from '../../../assets/data/muscles';
import SearchSortBar from '../../../assets/components/Main/SearchSortBar';
import MuscleCard from '../../../assets/components/screens/categories/MuscleCard';
import AppLogo from "../../../assets/components/ui/AppLogo";
import { API_URL } from '../../../assets/api/client'; // same you use elsewhere

export default function MusclesCategoryScreen() {
  const router = useRouter();
  const { targetDayId } = useLocalSearchParams();

  const [query, setQuery]   = useState('');
  const [sortBy, setSortBy] = useState('alpha');
  const [counts, setCounts] = useState({});     // { abs: 12, back: 9, ... }
  const [loading, setLoading] = useState(false);

  // fetch counts on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('accessToken'); // adjust key if different
        const res = await fetch(`${API_URL}/api/exercises/stats`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();
        if (!cancelled) setCounts(data || {});
      } catch (e) {
        console.log('stats fetch error', e);
        if (!cancelled) setCounts({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = MUSCLES.filter(m => m.name.toLowerCase().includes(q));
    if (sortBy === 'alpha') list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    // Build a safe key for this muscle and look up the count from the map
    const getKey = (m) => String(m.id || m.name).trim().toLowerCase();

    // inject count from stats map (MUSCLES[i].id is your slug: 'abs','back',...)
    return list.map(m => {
      const key = getKey(m);
      return { ...m, count: counts[key] ?? 0 };
    });
  }, [query, sortBy, counts]);

  const handlePress = (muscle) => {
    router.push({
      pathname: '/categories/[muscleId]',
      params: { muscleId: muscle.id, targetDayId: String(targetDayId ?? '') },
    });
  };

  return (
    <View className="flex-1 bg-bg px-4 pt-5 android:pt-4">
      <Stack.Screen
        options={{
          headerTitle: () => <AppLogo/>, 
          headerTitleAlign: "left",
          headerStyle: { backgroundColor: "#FDFBFA" },
        }}
      />
      <Text className="text-text text-2xl font-extrabold mb-1">Muscle Categories</Text>
      <Text className="text-muted mb-3">Choose a muscle group to add exercises.</Text>

      <SearchSortBar
        query={query}
        onChangeQuery={setQuery}
        sortBy={sortBy}
        onToggleSort={() => setSortBy(p => (p === 'alpha' ? 'custom' : 'alpha'))}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <MuscleCard item={item} onPress={handlePress} count={item.count} />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted">{loading ? 'Loading…' : 'No matches. Try a different search.'}</Text>
          </View>
        }
      />
    </View>
  );
}
