import { View, Text } from "react-native";

export default function MainFooter() {
  return (
    <View className="bg-[#1E1E1E] py-4 items-center border-t border-gray-700">
      <Text className="text-gray-400 text-sm">
        © {new Date().getFullYear()} ProgressPulse. All rights reserved.
      </Text>
    </View>
  );
}
