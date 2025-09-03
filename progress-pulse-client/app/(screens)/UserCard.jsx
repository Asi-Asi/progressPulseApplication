import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";

function UserCardBase({ user = {}, onEdit, onDelete }) {
  const name  = (user.name || "Unnamed").trim();
  const email = user.email || "—";
  const role  = user.role  || "user";

  return (
    <View className="flex-1 min-h-[140px] bg-[#2B2B2B] rounded-xl p-4 gap-2 border border-[#000000]/40">
      <Text className="text-[#FFD100] font-extrabold text-base" numberOfLines={1}>{name}</Text>
      <Text className="text-[#D1D5DB]" numberOfLines={1}>{email}</Text>
      {!!role && <Text className="text-[#9CA3AF]" numberOfLines={1}>Role: {role}</Text>}

      <View className="flex-row gap-2 mt-auto">
        <TouchableOpacity
          onPress={() => onEdit?.(user)}
          className="flex-1 bg-[#3B82F6] py-2.5 rounded-lg items-center"
        >
          <Text className="text-white font-bold">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDelete?.(user)}
          className="flex-1 bg-[#EF4444] py-2.5 rounded-lg items-center"
        >
          <Text className="text-white font-bold">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default memo(UserCardBase);
