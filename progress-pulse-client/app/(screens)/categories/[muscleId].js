// app/(screens)/categories/[muscleId].jsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExercisesFor } from '../../../assets/data/exercises.js';

// צבעים כמו במסך הקטגוריות
const COLORS = {
  bg: '#1E1E1E',
  text: '#F4F4F4',
  primary: '#FFD100',
  cta: '#FF5733',
  card: '#333533',
  divider: '#000000',
  muted: '#AAAAAA',
};

const titleFromId = (id) => id?.charAt(0).toUpperCase() + id?.slice(1);

export default function ExercisesByMuscle() {
  const { muscleId } = useLocalSearchParams();              // מזהה השריר מהנתיב
  const [query, setQuery] = useState('');                   // חיפוש
  const [level, setLevel] = useState('all');                // סינון רמה (all/beginner/intermediate)

  const all = getExercisesFor(String(muscleId));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(e =>
      (!q || e.name.toLowerCase().includes(q)) &&
      (level === 'all' || e.level.toLowerCase() === level)
    );
  }, [all, query, level]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.pills}>
          <View style={styles.pill}><Text style={styles.pillText}>{item.type}</Text></View>
          <View style={[styles.pill, { backgroundColor: COLORS.primary }]}><Text style={[styles.pillText, { color: '#111' }]}>{item.level}</Text></View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <MaterialCommunityIcons name="dumbbell" size={16} color={COLORS.text} />
          <Text style={styles.metaText}>{item.equipment}</Text>
        </View>
        <TouchableOpacity style={styles.ctaBtn}>
          <Text style={styles.ctaText}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `${titleFromId(String(muscleId))} • Exercises`, // כותרת הדף
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.primary,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        }}
      />

      {/* שורת חיפוש + סינון */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.muted} />
          <TextInput
            placeholder="Search exercise…"
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          onPress={() => setLevel(prev => prev === 'all' ? 'beginner' : prev === 'beginner' ? 'intermediate' : 'all')}
          style={styles.filterBtn}
        >
          <MaterialCommunityIcons name="filter-variant" size={16} color={COLORS.text} />
          <Text style={styles.filterText}>
            {level === 'all' ? 'All' : level === 'beginner' ? 'Beginner' : 'Intermediate'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* רשימת תרגילים */}
      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={renderItem}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            {all.length} total • {filtered.length} shown
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bg, padding: 16,
    paddingTop: Platform.select({ ios: 56, android: 16, default: 16 }),
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 16 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.card, borderRadius: 999, paddingHorizontal: 12, height: 36,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  filterText: { color: COLORS.text, fontWeight: '700' },
  subtitle: { color: COLORS.muted, marginBottom: 10 },

  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#2a2a2a' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', flex: 1 },
  pills: { flexDirection: 'row', gap: 6 },
  pill: { backgroundColor: '#00000044', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: COLORS.text, fontWeight: '700', fontSize: 12 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: COLORS.text },
  ctaBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  ctaText: { color: '#111', fontWeight: '700' },
});
// app/(screens)/categories/MusclesCategoryScreen.jsx