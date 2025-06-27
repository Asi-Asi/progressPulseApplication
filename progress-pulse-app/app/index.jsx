import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      className="flex-1 justify-center items-center bg-gray-100"
    >
      <View className="bg-white p-6 rounded-xl shadow-md w-72 mb-6 items-center">
        <Text className="text-2xl font-bold text-blue-600 mb-2">NativeWind Test</Text>
        <Text className="text-base text-gray-700 mb-1">This is a gray text.</Text>
        <Text className="text-lg text-green-500 mb-1">This is a green text.</Text>
        <Text className="text-lg text-red-500 mb-1">This is a red text.</Text>
        <Text className="text-lg text-yellow-500 mb-1">This is a yellow text.</Text>
        <Text className="text-lg font-semibold text-purple-600">Bold purple text</Text>
      </View>
      <Text style={{ color: "red" }}>Edit app/index.tsx to edit this screen.</Text>
      <Text style={{ color: "red" }}>Edit app/index.tsx to edit this screen.</Text>
      <Text className="text-red-500">Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}