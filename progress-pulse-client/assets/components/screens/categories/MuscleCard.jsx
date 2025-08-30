import { memo } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function MuscleCardBase({ item, onPress }) {
  const iconName = item.icon || 'dumbbell'; // fallback
  return (
    <TouchableOpacity
      className="flex-1 bg-secondaryBg rounded-2xl p-3 border"
      style={{ borderColor: item.color }}
      activeOpacity={0.85}
      onPress={() => onPress(item)}
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: `${item.color}22` }}
      >
        <MaterialCommunityIcons name={iconName} size={28} color="#F4F4F4" />
      </View>

      <Text className="text-primaryText text-base font-bold mb-2" numberOfLines={1}>
        {item.name}
      </Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 bg-black/25 px-2.5 py-1.5 rounded-full">
          <MaterialCommunityIcons name="dumbbell" size={14} color="#F4F4F4" />
          <Text className="text-primaryText text-xs font-bold">12</Text>
        </View>

        <View className="px-3 py-1.5 rounded-full bg-highlight">
          <Text className="text-black text-xs font-bold">View</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(MuscleCardBase);
