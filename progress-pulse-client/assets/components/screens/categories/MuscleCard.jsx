// assets/components/screens/categories/MuscleCard.jsx
import { memo } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MuscleIcon from '../../icons/MuscleIcon';

function MuscleCardBase({ item, onPress, count = 0 }) {
  return (
    <TouchableOpacity
      className="flex-1 rounded-2xl p-3 bg-card border border-border"
      activeOpacity={0.85}
      onPress={() => onPress(item)}
    >
      {/* Bigger icon chip (from 44→56) */}
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: '#007BFF1A' }}
      >
        {/* Bigger SVG (from 24/26→32) */}
        <MuscleIcon idOrName={item.id || item.name} size={50} />
      </View>

      <Text className="text-text text-base font-extrabold mb-2" numberOfLines={1}>
        {item.name}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-field border border-fieldBorder">
          <MaterialCommunityIcons name="dumbbell" size={14} color="#007BFF" />
          <Text className="text-text text-xs font-bold">{item.exerciseCount ?? {count}}</Text>
        </View>

        <View className="px-3 py-1.5 rounded-full bg-primary">
          <Text className="text-onPrimary text-xs font-bold">View</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(MuscleCardBase);
