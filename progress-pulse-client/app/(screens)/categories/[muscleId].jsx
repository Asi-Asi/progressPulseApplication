import React, { useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import ExerciseFilterBar from '../../../assets/components/Main/ExerciseFilterBar';
import ExerciseCard from '../../../assets/components/screens/exercises/ExerciseCard';
import { getExercisesFor } from '../../../assets/data/exercises';

const titleFromId = (id) => id?.charAt(0).toUpperCase() + id?.slice(1);

export default function ExercisesByMuscle() {
  const { muscleId } = useLocalSearchParams();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all'); // 'all' | 'beginner' | 'intermediate'

  const all = getExercisesFor(String(muscleId));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(e =>
      (!q || e.name.toLowerCase().includes(q)) &&
      (level === 'all' || e.level.toLowerCase() === level)
    );
  }, [all, query, level]);

  const cycleLevel = () =>
    setLevel(prev => (prev === 'all' ? 'beginner' : prev === 'beginner' ? 'intermediate' : 'all'));

  return (
    <View className="flex-1 bg-darkBg p-4 pt-14 android:pt-4">
      <Stack.Screen
        options={{
          title: `${titleFromId(String(muscleId))} • Exercises`,
          headerStyle: { backgroundColor: '#1E1E1E' },
          headerTintColor: '#FFD100',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        }}
      />

      <ExerciseFilterBar
        query={query}
        onChangeQuery={setQuery}
        level={level}
        onCycleLevel={cycleLevel}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <ExerciseCard
            item={item}
            onPressDetails={() => {
              // TODO: navigate to exercise details screen when you add it
              // e.g., router.push({ pathname: '/exercises/[exerciseId]', params: { exerciseId: item.id } });
            }}
          />
        )}
        ListHeaderComponent={
          <Text className="text-secondaryText mb-2">
            {all.length} total • {filtered.length} shown
          </Text>
        }
      />
    </View>
  );
}
  