import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MUSCLES } from '../../../assets/data/muscles';
import { getExercisesFor } from '../../../assets/data/exercises';
import { planDraft } from '../../../assets/lib/planDraft';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  bg: '#1E1E1E',
  text: '#F4F4F4',
  primary: '#FFD100',
  card: '#333533',
  muted: '#AAAAAA',
};

export default function ExercisesByMusclePicker() {
  const router = useRouter();
  const { muscleId, targetDayId } = useLocalSearchParams();
  const muscle = MUSCLES.find(m => m.id === muscleId);
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const base = getExercisesFor(muscleId) || [];
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      (ex.type?.toLowerCase() || '').includes(q) ||
      (ex.equipment?.toLowerCase() || '').includes(q)
    );
  }, [muscleId, query]);

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <Stack.Screen
        options={{
          title: muscle ? muscle.name : 'Exercises',
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.primary,
        }}
      />

      <View className="p-4">
        <Text className="font-bold mb-2" style={{ color: COLORS.text, fontSize: 18 }}>
          Choose an exercise
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name/type/equipment"
          placeholderTextColor={COLORS.muted}
          className="rounded-xl px-4 py-3 mb-3"
          style={{ backgroundColor: '#2A2B2A', color: COLORS.text }}
        />

        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                // add to plan and go back to /plan
                planDraft.addExercise(targetDayId, { ...item, muscle: muscle?.name, muscleId, sets: 1 });
                router.push('/plan');
              }}
              className="rounded-xl px-4 py-3"
              style={{ backgroundColor: COLORS.card }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <MaterialCommunityIcons name="dumbbell" size={20} color={COLORS.primary} />
                  <View>
                    <Text style={{ color: COLORS.text, fontWeight: '600' }}>{item.name}</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                      {item.type} • {item.equipment}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Add</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}
