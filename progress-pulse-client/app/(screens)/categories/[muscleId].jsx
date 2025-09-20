import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MUSCLES } from '../../../assets/data/muscles';
import { getExercisesFor } from '../../../assets/data/exercises';
import { planDraft } from '../../../assets/lib/planDraft';

export default function ExercisesByMusclePicker() {
  const router = useRouter();
  const { muscleId, targetDayId } = useLocalSearchParams();
  const muscle = MUSCLES.find((m) => m.id === muscleId);
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const base = getExercisesFor(muscleId) || [];
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        (ex.type?.toLowerCase() || '').includes(q) ||
        (ex.equipment?.toLowerCase() || '').includes(q)
    );
  }, [muscleId, query]);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          title: muscle ? muscle.name : 'Exercises',
          headerStyle: { backgroundColor: '#FDFBFA' }, // bg
          headerTintColor: '#007BFF', // primary
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <View className="px-4 pt-5 pb-4">
        {/* In-page title to match other screens */}
        <Text className="text-text text-2xl font-extrabold">
          {muscle ? `${muscle.name} Exercises` : 'Exercises'}
        </Text>
        <Text className="text-muted mt-1">
          Choose an exercise to add to your plan.
        </Text>

        {/* Search */}
        <View className="mt-4">
          <View className="flex-row items-center rounded-2xl bg-field border border-fieldBorder px-3">
            <MaterialCommunityIcons name="magnify" size={20} color="#667085" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name / type / equipment"
              placeholderTextColor="#667085" // fieldMuted
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

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <MaterialCommunityIcons name="dumbbell" size={28} color="#007BFF" />
            <Text className="text-muted mt-2">No exercises match your search.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              planDraft.addExercise(targetDayId, {
                ...item,
                muscle: muscle?.name,
                muscleId,
                sets: 1,
              });
              router.push('/plan');
            }}
            className="rounded-2xl px-4 py-3 bg-card"
            activeOpacity={0.9}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#007BFF1A' }}>
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
    </View>
  );
}
