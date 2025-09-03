// app/(screens)/categories/index.jsx
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { MUSCLES } from '../../../assets/data/muscles';
import SearchSortBar from '../../../assets/components/Main/SearchSortBar';
import MuscleCard from '../../../assets/components/screens/categories/MuscleCard';

export default function MusclesCategoryScreen() {
  const router = useRouter();
  const { targetDayId } = useLocalSearchParams(); // passed from /plan
  const [query, setQuery]   = useState('');
  const [sortBy, setSortBy] = useState('alpha');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = MUSCLES.filter(m => m.name.toLowerCase().includes(q));
    if (sortBy === 'alpha') list = [...list].sort((a, b) => a.name.localeCompare(b.name)); // avoid mutating original
    return list;
  }, [query, sortBy]);

  const handlePress = (muscle) => {
    router.push({
      pathname: '/categories/[muscleId]',
      params: { muscleId: muscle.id, targetDayId: String(targetDayId ?? '') },
    });
  };

  return (
    <View className="flex-1 bg-darkBg p-4 pt-14 android:pt-4">
      <Text className="text-primaryText text-2xl font-bold mb-3">Muscle Categories</Text>

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
        renderItem={({ item }) => <MuscleCard item={item} onPress={handlePress} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </View>
  );
}
