import { View, Text, Image, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function ProfileCard({ user }) {
  const name = user?.fullName || user?.name || "User";
  const initials = name.split(" ").map(n => n[0]?.toUpperCase()).join("").slice(0, 2);

  return (
    <View className="bg-[#333533] rounded-2xl p-4 space-y-4 border border-[#000000]/40">
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <View className="w-[72px] h-[72px] rounded-full bg-[#1E1E1E] border-[3px] border-[#FFD100] items-center justify-center overflow-hidden">
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-[#FFD100] text-2xl font-extrabold">{initials || "U"}</Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-[#FFD100] text-xl font-extrabold">{name}</Text>
          <Text className="text-[#CFCFCF] mt-0.5">{user?.email || "-"}</Text>
          <View className="self-start bg-[#00A896] px-3 py-1 rounded-full mt-1.5">
            <Text className="text-[#0B0F12] font-bold text-xs">{user?.role || "user"}</Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View className="bg-[#2B2B2B] rounded-xl p-3 space-y-2">
        <Detail label="Phone"    value={user?.phone || "—"} />
        <Detail label="Birthday" value={user?.birthDate || "—"} />
        <Detail label="Location" value={user?.location || "—"} />
        <Detail label="User ID"  value={(user?._id || "").toString()} />
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-[#3B82F6] py-3 rounded-xl items-center"
          onPress={() => router.push("/EditProfile")}
        >
          <Text className="text-white font-extrabold">Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-[#FF5A2C] py-3 rounded-xl items-center"
          onPress={async () => {
            await AsyncStorage.removeItem("token");
            router.replace("/Login");
          }}
        >
          <Text className="text-white font-extrabold">Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Detail({ label, value }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-[#9AA0A6] font-semibold">{label}</Text>
      <Text className="text-[#F4F4F4] flex-1 text-right" numberOfLines={1}>{value}</Text>
    </View>
  );
}
