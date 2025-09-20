// app/(screens)/categories/index.jsx
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';

import { MUSCLES } from '../../../assets/data/muscles';
import SearchSortBar from '../../../assets/components/Main/SearchSortBar';
import MuscleCard from '../../../assets/components/screens/categories/MuscleCard';
import AppLogo from "../../../assets/components/ui/AppLogo";

export default function MusclesCategoryScreen() {
  const router = useRouter();
  const { targetDayId } = useLocalSearchParams(); // passed from /plan
  const [query, setQuery]   = useState('');
  const [sortBy, setSortBy] = useState('alpha');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = MUSCLES.filter(m => m.name.toLowerCase().includes(q));
    if (sortBy === 'alpha') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [query, sortBy]);

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
      {/* In-page title (not Stack header) */}
      <Text className="text-text text-2xl font-extrabold mb-1">Muscle Categories</Text>
      <Text className="text-muted mb-3">Choose a muscle group to add exercises.</Text>

      <SearchSortBar
        query={query}
        onChangeQuery={setQuery}
        sortBy={sortBy}
        onToggleSort={() => setSortBy(p => (p === 'alpha' ? 'custom' : 'alpha'))}
        /* If SearchSortBar supports className/props, keep it on-brand: */
        // containerClass="bg-bg"
        // inputClass="bg-field border border-fieldBorder text-text placeholder:text-fieldMuted"
        // chipClass="bg-card text-text"
        // iconColor="#2C2C2C"
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => <MuscleCard item={item} onPress={handlePress} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-muted">No matches. Try a different search.</Text>
          </View>
        }
      />
    </View>
  );
}