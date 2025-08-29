// app/(screens)/categories/MusclesCategoryScreen.jsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


const COLORS = {
  bg: '#1E1E1E',
  text: '#F4F4F4',
  primary: '#FFD100',
  cta: '#FF5733',
  card: '#333533',
  divider: '#000000',
  muted: '#AAAAAA',
};

// Static demo data (frontend only)
const MUSCLES = [
  { id: 'chest',      name: 'Chest',      icon: 'arm-flex-outline', color: '#FF8A65' },
  { id: 'back',       name: 'Back',       icon: '',       color: '#90CAF9' },
  { id: 'shoulders',  name: 'Shoulders',  icon: '',    color: '#FFD54F' },
  { id: 'biceps',     name: 'Biceps',     icon: 'arm-flex',         color: '#A5D6A7' },
  { id: 'triceps',    name: 'Triceps',    icon: 'arm-flex-outline', color: '#CE93D8' },
  { id: 'forearms',   name: 'Forearms',   icon: 'arm-flex-outline', color: '#B0BEC5' },
  { id: 'abs',        name: 'Abs',        icon: '',         color: '#FFF59D' },
  { id: 'legs',     name: 'Legs',     icon: '',     color: '#F48FB1' },
];

export default function MusclesCategoryScreen({ onSelect }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('alpha'); // alpha | custom

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let list = MUSCLES.filter(m => m.name.toLowerCase().includes(normalized));
    if (sortBy === 'alpha') list = list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [query, sortBy]);

   const handlePress = (muscle) => {
    //נווט למסך תרגילים: /exercises/[muscleId]
    router.push({ pathname: '/exercises/[muscleId]', params: { muscleId: muscle.id } });
    onSelect?.(muscle); // אופציונלי
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { borderColor: item.color }]}
      onPress={() => handlePress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
        <MaterialCommunityIcons name={item.icon} size={28} />
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="dumbbell" size={14} color={COLORS.text} />
          <Text style={styles.badgeText}>12</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
          <Text style={[styles.badgeText, { color: '#111' }]}>View</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Muscle Categories</Text>

      {/* Search + sort */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.muted} />
          <TextInput
            placeholder="Search muscle…"
            placeholderTextColor={COLORS.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          onPress={() => setSortBy(p => (p === 'alpha' ? 'custom' : 'alpha'))}
          style={styles.pill}
        >
          <MaterialCommunityIcons name="sort" size={16} color={COLORS.text} />
          <Text style={styles.pillText}>{sortBy === 'alpha' ? 'A→Z' : '⭐'}</Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
    paddingTop: Platform.select({ ios: 56, android: 16, default: 16 }),
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  pillText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00000044',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 12,
  },
});
