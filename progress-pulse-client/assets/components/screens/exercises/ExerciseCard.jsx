import React, { memo } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function ExerciseCardBase({ item, onPressDetails }) {
  return (
    <TouchableOpacity className="bg-secondaryBg rounded-xl p-3 border border-[#2a2a2a]" activeOpacity={0.85}>
      {/* title + pills */}
      <View className="flex-row justify-between gap-2 mb-2">
        <Text className="text-primaryText text-base font-bold flex-1" numberOfLines={1}>
          {item.name}
        </Text>
        <View className="flex-row gap-1.5">
          <View className="bg-black/25 px-2.5 py-1 rounded-full">
            <Text className="text-primaryText text-xs font-bold">{item.type}</Text>
          </View>
          <View className="bg-highlight px-2.5 py-1 rounded-full">
            <Text className="text-black text-xs font-bold">{item.level}</Text>
          </View>
        </View>
      </View>

      {/* meta + CTA */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons name="dumbbell" size={16} color="#F4F4F4" />
          <Text className="text-primaryText">{item.equipment}</Text>
        </View>

        <TouchableOpacity onPress={() => onPressDetails?.(item)} className="bg-highlight px-3 py-1.5 rounded-full">
          <Text className="text-black font-bold">Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ExerciseCardBase);
