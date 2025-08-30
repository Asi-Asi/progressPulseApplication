import React from "react";
import { View, ScrollView } from "react-native";
import { Stack } from "expo-router";
import ProfileCard from "./ProfileCard"; // adjust path if needed

export default function Profile() {
  // 🔒 Hard-coded demo user – edit freely
  const demoUser = {
    _id: "demo-123",
    fullName: "James Brown",
    email: "james.1234@gmail.com",
    role: "user",
    phone: "+1 (555) 123-4567",
    birthDate: "1999-05-12",
    location: "United Kingdom",
    profileImage: null, // or a URL: "https://i.pravatar.cc/160"
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#1E1E1E" }}>
      <Stack.Screen
        options={{
          title: "Profile",
          headerStyle: { backgroundColor: "#1E1E1E" },
          headerTintColor: "#FFD100",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <ProfileCard user={demoUser} />
        {/* Add more demo cards/sections here if you want */}
      </ScrollView>
    </View>
  );
}
