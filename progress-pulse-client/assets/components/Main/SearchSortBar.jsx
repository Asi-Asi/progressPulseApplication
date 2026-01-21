import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SearchSortBar({ query, onChangeQuery, sortBy, onToggleSort }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <View className="flex-1 flex-row items-center gap-1.5 bg-secondaryBg rounded-xl px-3 h-11 border border-[#2a2a2a]">
        <MaterialCommunityIcons name="magnify" size={20} color="#AAAAAA" />
        <TextInput
          className="flex-1 text-primaryText text-base"
          placeholder="Search muscle…"
          placeholderTextColor="#AAAAAA"
          value={query}
          onChangeText={onChangeQuery}
        />
      </View>

      <TouchableOpacity
        onPress={onToggleSort}
        className="flex-row items-center gap-1.5 bg-secondaryBg rounded-full px-3 h-9 border border-[#2a2a2a]"
      >
        <MaterialCommunityIcons name="sort" size={16} color="#F4F4F4" />
        <Text className="text-primaryText font-bold">{sortBy === 'alpha' ? 'A→Z' : '⭐'}</Text>
      </TouchableOpacity>
    </View>
  );
}
