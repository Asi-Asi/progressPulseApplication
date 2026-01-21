import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function MainHeader() {
  const router = useRouter();

  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-[#1E1E1E]">
      {/* Logo or App Name */}
      <Text className="text-white text-xl font-bold">ProgressPulse</Text>

      {/* Navigation Buttons */}
      <View className="flex-row gap-3">
        {/* Home Button */}
        <TouchableOpacity
          onPress={() => router.push("/")}
          className="bg-[#FFD100] px-3 py-2 rounded-lg"
        >
          <Text className="text-black font-bold">Home</Text>
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="bg-[#FFD100] px-3 py-2 rounded-lg"
        >
          <Text className="text-black font-bold">Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
